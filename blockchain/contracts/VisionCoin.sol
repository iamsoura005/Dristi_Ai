// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title VisionCoin
 * @dev ERC-20 token earned based on fundus eye health condition
 * @notice VSC tokens are minted based on eye health analysis results
 */
contract VisionCoin is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ANALYZER_ROLE = keccak256("ANALYZER_ROLE");
    
    // Health condition reward amounts
    uint256 public constant NORMAL_CONDITION_REWARD = 10 * 10**18; // 10 VSC
    uint256 public constant MILD_ABNORMALITY_REWARD = 5 * 10**18;  // 5 VSC
    uint256 public constant SEVERE_ABNORMALITY_REWARD = 0;         // 0 VSC
    
    // Health condition enum
    enum HealthCondition {
        NORMAL,
        MILD_ABNORMALITY,
        SEVERE_ABNORMALITY
    }
    
    // User health tracking
    struct HealthAnalysis {
        HealthCondition condition;
        uint256 timestamp;
        string ipfsHash; // IPFS hash of the fundus image analysis
        uint256 tokensEarned;
    }
    
    // Mappings
    mapping(address => HealthAnalysis[]) public userHealthHistory;
    mapping(address => uint256) public totalTokensEarned;
    mapping(address => uint256) public lastAnalysisTime;
    mapping(address => HealthCondition) public currentHealthStatus;
    
    // Statistics
    uint256 public totalAnalyses;
    uint256 public totalUsersAnalyzed;
    mapping(HealthCondition => uint256) public conditionCounts;
    
    // Events
    event HealthAnalysisCompleted(
        address indexed user,
        HealthCondition condition,
        uint256 tokensEarned,
        string ipfsHash,
        uint256 timestamp
    );
    
    event TokensEarnedFromHealth(
        address indexed user,
        uint256 amount,
        HealthCondition condition
    );
    
    // Modifiers
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier validIPFSHash(string memory ipfsHash) {
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        _;
    }
    
    /**
     * @dev Constructor initializes VisionCoin
     */
    constructor() ERC20("VisionCoin", "VSC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ANALYZER_ROLE, msg.sender);
    }
    
    /**
     * @dev Process fundus analysis and mint tokens based on health condition
     * @param user Address of the user
     * @param condition Health condition from analysis
     * @param ipfsHash IPFS hash of the analysis data
     */
    function processHealthAnalysis(
        address user,
        HealthCondition condition,
        string memory ipfsHash
    )
        external
        onlyRole(ANALYZER_ROLE)
        validAddress(user)
        validIPFSHash(ipfsHash)
        whenNotPaused
        nonReentrant
    {
        uint256 tokensToMint = _getTokensForCondition(condition);
        
        // Create health analysis record
        HealthAnalysis memory analysis = HealthAnalysis({
            condition: condition,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            tokensEarned: tokensToMint
        });
        
        // Update user data
        if (userHealthHistory[user].length == 0) {
            totalUsersAnalyzed++;
        }
        
        userHealthHistory[user].push(analysis);
        totalTokensEarned[user] += tokensToMint;
        lastAnalysisTime[user] = block.timestamp;
        currentHealthStatus[user] = condition;
        
        // Update statistics
        totalAnalyses++;
        conditionCounts[condition]++;
        
        // Mint tokens if applicable
        if (tokensToMint > 0) {
            _mint(user, tokensToMint);
            emit TokensEarnedFromHealth(user, tokensToMint, condition);
        }
        
        emit HealthAnalysisCompleted(
            user,
            condition,
            tokensToMint,
            ipfsHash,
            block.timestamp
        );
    }
    
    /**
     * @dev Get tokens amount for health condition
     * @param condition Health condition
     * @return Token amount to mint
     */
    function _getTokensForCondition(HealthCondition condition)
        internal
        pure
        returns (uint256)
    {
        if (condition == HealthCondition.NORMAL) {
            return NORMAL_CONDITION_REWARD;
        } else if (condition == HealthCondition.MILD_ABNORMALITY) {
            return MILD_ABNORMALITY_REWARD;
        } else {
            return SEVERE_ABNORMALITY_REWARD;
        }
    }
    
    /**
     * @dev Get user's health history
     * @param user Address of the user
     * @return Array of health analyses
     */
    function getUserHealthHistory(address user)
        external
        view
        returns (HealthAnalysis[] memory)
    {
        return userHealthHistory[user];
    }
    
    /**
     * @dev Get user's latest health analysis
     * @param user Address of the user
     * @return Latest health analysis
     */
    function getLatestHealthAnalysis(address user)
        external
        view
        returns (HealthAnalysis memory)
    {
        require(userHealthHistory[user].length > 0, "No health history found");
        return userHealthHistory[user][userHealthHistory[user].length - 1];
    }
    
    /**
     * @dev Get user's health statistics
     * @param user Address of the user
     * @return totalEarned Total tokens earned from health analyses
     * @return analysisCount Number of analyses completed
     * @return currentCondition Current health status
     * @return lastAnalysis Timestamp of last analysis
     */
    function getUserHealthStats(address user)
        external
        view
        returns (
            uint256 totalEarned,
            uint256 analysisCount,
            HealthCondition currentCondition,
            uint256 lastAnalysis
        )
    {
        return (
            totalTokensEarned[user],
            userHealthHistory[user].length,
            currentHealthStatus[user],
            lastAnalysisTime[user]
        );
    }
    
    /**
     * @dev Get global health statistics
     * @return totalUsers Total users analyzed
     * @return totalAnalysisCount Total analyses performed
     * @return normalCount Count of normal conditions
     * @return mildCount Count of mild abnormalities
     * @return severeCount Count of severe abnormalities
     */
    function getGlobalHealthStats()
        external
        view
        returns (
            uint256 totalUsers,
            uint256 totalAnalysisCount,
            uint256 normalCount,
            uint256 mildCount,
            uint256 severeCount
        )
    {
        return (
            totalUsersAnalyzed,
            totalAnalyses,
            conditionCounts[HealthCondition.NORMAL],
            conditionCounts[HealthCondition.MILD_ABNORMALITY],
            conditionCounts[HealthCondition.SEVERE_ABNORMALITY]
        );
    }
    
    /**
     * @dev Custom mint function for admin use
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        validAddress(to)
        whenNotPaused
    {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from user's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override whenNotPaused {
        super.burn(amount);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
