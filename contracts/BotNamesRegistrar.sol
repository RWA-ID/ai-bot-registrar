// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

interface INameWrapper {
    function setSubnodeRecord(
        bytes32 parentNode,
        string calldata label,
        address owner,
        address resolver,
        uint64 ttl,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32 node);

    function getData(uint256 id) external view returns (address owner, uint32 fuses, uint64 expiry);

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
}

interface IENSRegistry {
    function owner(bytes32 node) external view returns (address);
}

interface IMulticallResolver {
    function multicallWithNodeCheck(bytes32 node, bytes[] calldata data) external returns (bytes[] memory);
}

/**
 * @title BotNamesRegistrar
 * @notice Bot Names: <label>.ai-bot.eth for AI agents, registered and configured in one transaction.
 *
 * One call mints the name, sets its resolver, writes its records (ETH and other EVM addresses,
 * Bitcoin, Solana, avatar, contenthash, any text) and hands it to `owner`.
 *
 * Names are emancipated: PARENT_CANNOT_CONTROL is burned at mint, so the parent can never take
 * one back. That is also what lets a name migrate to ENSv2 (a "detached 3LD") once ai-bot.eth
 * migrates; a name minted with fuses 0, as the v1 registrar did, cannot. CAN_EXTEND_EXPIRY is
 * burned too, so an owner can extend its own name up to the parent's expiry.
 *
 * ENSv2: this contract writes through the v1 NameWrapper, which keeps working for ai-bot.eth
 * until the parent is migrated. After that, subnames are issued by register() on ai-bot.eth's
 * v2 subregistry, by a new registrar. Off-chain code must key names on the labelhash, never on
 * a cached token ID, and look the resolver up at write time.
 */
contract BotNamesRegistrar is Ownable2Step, ReentrancyGuard, ERC1155Holder {
    uint32 public constant PARENT_CANNOT_CONTROL = 1 << 16;
    uint32 public constant CAN_EXTEND_EXPIRY = 1 << 18;
    uint32 public constant CHILD_FUSES = PARENT_CANNOT_CONTROL | CAN_EXTEND_EXPIRY;

    uint256 public constant MIN_LABEL_LENGTH = 3;
    uint256 public constant MAX_LABEL_LENGTH = 63; // fits a DNS label, e.g. <label>.botnames.dev

    INameWrapper public immutable nameWrapper;
    IENSRegistry public immutable ensRegistry;
    bytes32 public immutable parentNode; // namehash("ai-bot.eth")

    address public resolver;
    uint256 public fee;

    event NameRegistered(
        string label,
        bytes32 indexed labelhash,
        bytes32 node,
        address indexed owner,
        address indexed payer,
        uint256 fee
    );
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event ResolverUpdated(address oldResolver, address newResolver);
    event Withdrawn(address indexed to, uint256 amount);

    error InvalidLabel();
    error NameTaken();
    error InsufficientFee(uint256 required);
    error ZeroAddress();
    error TransferFailed();

    constructor(
        address _nameWrapper,
        address _ensRegistry,
        bytes32 _parentNode,
        address _resolver,
        uint256 _fee
    ) Ownable(msg.sender) {
        if (_nameWrapper == address(0) || _ensRegistry == address(0) || _resolver == address(0)) {
            revert ZeroAddress();
        }
        nameWrapper = INameWrapper(_nameWrapper);
        ensRegistry = IENSRegistry(_ensRegistry);
        parentNode = _parentNode;
        resolver = _resolver;
        fee = _fee;
    }

    // ── Register ─────────────────────────────────────────────────────────────

    /**
     * @notice Register `<label>.ai-bot.eth` to `owner` and write its records in the same tx.
     * @param label   lowercase a-z, 0-9 and hyphens, 3-63 chars, no leading/trailing hyphen
     * @param owner   receives the name (an EOA or a contract that accepts ERC-1155)
     * @param records resolver calls (setAddr, setText, setContenthash, ...) for this name's node;
     *                the resolver rejects any call aimed at another node
     */
    function register(string calldata label, address owner, bytes[] calldata records)
        external
        payable
        nonReentrant
        returns (bytes32 node)
    {
        if (owner == address(0)) revert ZeroAddress();
        if (msg.value < fee) revert InsufficientFee(fee);
        if (!validLabel(label)) revert InvalidLabel();

        bytes32 labelhash = keccak256(bytes(label));
        node = keccak256(abi.encodePacked(parentNode, labelhash));
        if (!_available(node)) revert NameTaken();

        // Mint to this contract first: as owner it can write the records, then hand the name over.
        // The expiry is capped by the NameWrapper at the parent's expiry.
        nameWrapper.setSubnodeRecord(parentNode, label, address(this), resolver, 0, CHILD_FUSES, type(uint64).max);

        if (records.length > 0) {
            IMulticallResolver(resolver).multicallWithNodeCheck(node, records);
        }

        nameWrapper.safeTransferFrom(address(this), owner, uint256(node), 1, "");

        uint256 excess = msg.value - fee;
        if (excess > 0) {
            (bool ok,) = msg.sender.call{value: excess}("");
            if (!ok) revert TransferFailed();
        }

        emit NameRegistered(label, labelhash, node, owner, msg.sender, fee);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function available(string calldata label) external view returns (bool) {
        if (!validLabel(label)) return false;
        return _available(keccak256(abi.encodePacked(parentNode, keccak256(bytes(label)))));
    }

    /// @notice a-z, 0-9 and hyphens; no leading/trailing hyphen; no "--" at positions 3-4 (ENSIP-15).
    function validLabel(string calldata label) public pure returns (bool) {
        bytes calldata b = bytes(label);
        uint256 len = b.length;
        if (len < MIN_LABEL_LENGTH || len > MAX_LABEL_LENGTH) return false;
        if (b[0] == "-" || b[len - 1] == "-") return false;
        if (len >= 4 && b[2] == "-" && b[3] == "-") return false;
        for (uint256 i = 0; i < len; i++) {
            bytes1 c = b[i];
            if (!((c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c == "-")) return false;
        }
        return true;
    }

    /// @dev Free when nobody holds the wrapped token (the NameWrapper reports an expired
    ///      emancipated name as owner 0) and no unwrapped registry entry exists either.
    function _available(bytes32 node) internal view returns (bool) {
        (address wrappedOwner,,) = nameWrapper.getData(uint256(node));
        if (wrappedOwner != address(0)) return false;
        address registryOwner = ensRegistry.owner(node);
        return registryOwner == address(0) || registryOwner == address(nameWrapper);
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setFee(uint256 newFee) external onlyOwner {
        emit FeeUpdated(fee, newFee);
        fee = newFee;
    }

    /// @notice For a resolver migration (e.g. ENS's PublicResolverV2). Affects new names only.
    function setResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert ZeroAddress();
        emit ResolverUpdated(resolver, newResolver);
        resolver = newResolver;
    }

    function withdraw(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = address(this).balance;
        (bool ok,) = to.call{value: bal}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, bal);
    }
}
