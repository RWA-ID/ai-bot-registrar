// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ENS Registry interface
interface ENS {
    function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external;
    function setSubnodeOwner(bytes32 node, bytes32 label, address owner) external returns (bytes32);
}

/**
 * @title AIBotSubdomainRegistrar
 * @dev Agent-first ENS subdomain registrar for ai-bot.eth
 * Allows AI agents to register subdomains with automatic resolver setup
 */
contract AIBotSubdomainRegistrar {
    // Events for agent discovery and monitoring
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

    // ENS registry address
    ENS public ens;
    
    // ENS Public Resolver address
    address public publicResolver;
    
    // The namehash of ai-bot.eth
    bytes32 public rootNode;
    
    // Registration price in wei
    uint256 public registrationPrice;
    
    // Contract owner (for admin functions)
    address public owner;
    
    // Mapping to track registered subdomains
    mapping(bytes32 => bool) public subdomainTaken;
    mapping(bytes32 => address) public subdomainOwner;
    mapping(address => string[]) public agentSubdomains;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor(
        address _ensRegistry,
        address _publicResolver,
        bytes32 _rootNode,
        uint256 _registrationPrice
    ) {
        ens = ENS(_ensRegistry);
        publicResolver = _publicResolver;
        rootNode = _rootNode;
        registrationPrice = _registrationPrice;
        owner = msg.sender;
    }

    /**
     * @dev Register a subdomain under ai-bot.eth with automatic resolver setup
     * Uses setSubnodeRecord to set owner and resolver in one atomic operation
     * @param subdomain The subdomain name (e.g., "agent1" for agent1.ai-bot.eth)
     * @return subnode The namehash of the registered subdomain
     */
    function registerSubdomain(string calldata subdomain) 
        external 
        payable 
        returns (bytes32) 
    {
        require(msg.value >= registrationPrice, "Insufficient payment");
        require(bytes(subdomain).length > 0, "Subdomain cannot be empty");
        require(bytes(subdomain).length <= 32, "Subdomain too long");
        
        // Calculate the label hash
        bytes32 label = keccak256(bytes(subdomain));
        
        require(!subdomainTaken[label], "Subdomain already taken");
        
        // Mark subdomain as taken
        subdomainTaken[label] = true;
        
        // Calculate the subnode hash (full domain hash)
        bytes32 subnode = keccak256(abi.encodePacked(rootNode, label));
        
        // Use setSubnodeRecord to atomically set owner AND resolver
        // This way the subdomain is created with resolver already set
        ens.setSubnodeRecord(rootNode, label, msg.sender, publicResolver, 0);
        
        // Track subdomain ownership
        subdomainOwner[subnode] = msg.sender;
        agentSubdomains[msg.sender].push(subdomain);
        
        // Emit event for agent discovery
        emit SubdomainRegistered(
            subdomain,
            msg.sender,
            label,
            subnode,
            msg.value,
            block.timestamp
        );
        
        // Refund excess payment
        if (msg.value > registrationPrice) {
            payable(msg.sender).transfer(msg.value - registrationPrice);
        }
        
        return subnode;
    }

    /**
     * @dev Check if a subdomain is available
     * @param subdomain The subdomain to check
     */
    function isSubdomainAvailable(string calldata subdomain) 
        external 
        view 
        returns (bool) 
    {
        bytes32 label = keccak256(bytes(subdomain));
        return !subdomainTaken[label];
    }

    /**
     * @dev Get the full namehash for a subdomain
     * @param subdomain The subdomain name
     */
    function getSubnodeHash(string calldata subdomain) 
        external 
        view 
        returns (bytes32) 
    {
        bytes32 label = keccak256(bytes(subdomain));
        return keccak256(abi.encodePacked(rootNode, label));
    }

    /**
     * @dev Get all subdomains registered by an agent
     * @param agent The agent's address
     */
    function getAgentSubdomains(address agent) 
        external 
        view 
        returns (string[] memory) 
    {
        return agentSubdomains[agent];
    }

    /**
     * @dev Update registration price (owner only)
     * @param newPrice New price in wei
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = registrationPrice;
        registrationPrice = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Withdraw collected fees (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner).transfer(balance);
        emit FundsWithdrawn(owner, balance);
    }

    /**
     * @dev Transfer ownership (owner only)
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @dev Get contract info for agent discovery
     */
    function getContractInfo() external view returns (
        address ensRegistry,
        address resolver,
        bytes32 rootNodeHash,
        uint256 price,
        address contractOwner
    ) {
        return (
            address(ens),
            publicResolver,
            rootNode,
            registrationPrice,
            owner
        );
    }
}
