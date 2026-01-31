// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ENS Name Wrapper interface
interface INameWrapper {
    function setSubnodeOwner(
        bytes32 parentNode,
        string calldata label,
        address owner,
        uint32 fuses,
        uint64 expiry
    ) external returns (bytes32);
    
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title AIBotSubdomainRegistrarWrapper
 * @dev Agent-first ENS subdomain registrar for wrapped ai-bot.eth
 * Works with ENS Name Wrapper for wrapped domains
 */
contract AIBotSubdomainRegistrarWrapper {
    // Events
    event SubdomainRegistered(
        string subdomain,
        address indexed owner,
        bytes32 indexed label,
        bytes32 subnode,
        uint256 price,
        uint256 timestamp
    );
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // Name Wrapper contract
    INameWrapper public nameWrapper;
    
    // ENS Public Resolver address (for reference)
    address public publicResolver;
    
    // The namehash of ai-bot.eth
    bytes32 public rootNode;
    
    // Registration price in wei
    uint256 public registrationPrice;
    
    // Contract owner
    address public owner;
    
    // Parent name expiry (ai-bot.eth expiry)
    uint64 public parentExpiry;
    
    // Mappings
    mapping(bytes32 => bool) public subdomainTaken;
    mapping(bytes32 => address) public subdomainOwner;
    mapping(address => string[]) public agentSubdomains;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(
        address _nameWrapper,
        address _publicResolver,
        bytes32 _rootNode,
        uint256 _registrationPrice,
        uint64 _parentExpiry
    ) {
        nameWrapper = INameWrapper(_nameWrapper);
        publicResolver = _publicResolver;
        rootNode = _rootNode;
        registrationPrice = _registrationPrice;
        parentExpiry = _parentExpiry;
        owner = msg.sender;
    }

    /**
     * @dev Register a subdomain using Name Wrapper
     */
    function registerSubdomain(string calldata subdomain) 
        external 
        payable 
        returns (bytes32) 
    {
        require(msg.value >= registrationPrice, "Insufficient payment");
        require(bytes(subdomain).length > 0, "Subdomain cannot be empty");
        require(bytes(subdomain).length <= 32, "Subdomain too long");
        
        bytes32 label = keccak256(bytes(subdomain));
        require(!subdomainTaken[label], "Subdomain already taken");
        
        subdomainTaken[label] = true;
        bytes32 subnode = keccak256(abi.encodePacked(rootNode, label));
        
        // Use Name Wrapper to create subdomain
        // fuses = 0 (no restrictions), expiry = parent expiry
        nameWrapper.setSubnodeOwner(
            rootNode,
            subdomain,
            msg.sender,
            0,
            parentExpiry
        );
        
        subdomainOwner[subnode] = msg.sender;
        agentSubdomains[msg.sender].push(subdomain);
        
        emit SubdomainRegistered(
            subdomain,
            msg.sender,
            label,
            subnode,
            msg.value,
            block.timestamp
        );
        
        if (msg.value > registrationPrice) {
            payable(msg.sender).transfer(msg.value - registrationPrice);
        }
        
        return subnode;
    }

    function isSubdomainAvailable(string calldata subdomain) 
        external 
        view 
        returns (bool) 
    {
        bytes32 label = keccak256(bytes(subdomain));
        return !subdomainTaken[label];
    }

    function getSubnodeHash(string calldata subdomain) 
        external 
        view 
        returns (bytes32) 
    {
        bytes32 label = keccak256(bytes(subdomain));
        return keccak256(abi.encodePacked(rootNode, label));
    }

    function getAgentSubdomains(address agent) 
        external 
        view 
        returns (string[] memory) 
    {
        return agentSubdomains[agent];
    }

    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = registrationPrice;
        registrationPrice = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    function updateParentExpiry(uint64 newExpiry) external onlyOwner {
        parentExpiry = newExpiry;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner).transfer(balance);
        emit FundsWithdrawn(owner, balance);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function getContractInfo() external view returns (
        address wrapper,
        address resolver,
        bytes32 rootNodeHash,
        uint256 price,
        uint64 expiry,
        address contractOwner
    ) {
        return (
            address(nameWrapper),
            publicResolver,
            rootNode,
            registrationPrice,
            parentExpiry,
            owner
        );
    }
}
