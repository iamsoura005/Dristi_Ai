// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DRSTCoin
 * @dev ERC-20 token for Dristi AI reward system
 * @notice Users earn DRST tokens for completing health activities
 */
contract DRSTCoin is ERC20, ERC20Burnable, AccessControl, ReentrancyGuard, Pausable {
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Reward amounts for different activities
    uint256 public constant EYE_TEST_REWARD = 50 * 10**18; // 50 DRST
    uint256 public constant DAILY_EXERCISE_REWARD = 5 * 10**18; // 5 DRST
    uint256 public constant FAMILY_MEMBER_REWARD = 20 * 10**18; // 20 DRST
    
    // Activity tracking
    mapping(address => uint256) public lastExerciseTime;
    mapping(address => uint256) public totalEyeTests;
    mapping(address => uint256) public totalExercises;
    mapping(address => uint256) public familyMembersAdded;
    
    // Discount system
    mapping(address => uint256) public discountBalance;
    uint256 public constant DISCOUNT_RATE = 100; // 100 DRST = 1% discount
    
    // Events
    event RewardMinted(address indexed user, uint256 amount, string activityType);
    event DiscountApplied(address indexed user, uint256 tokensSpent, uint256 discountPercent);
    event TokensRedeemed(address indexed user, uint256 amount, string purpose);
    
    // Modifiers
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier onlyOncePerDay(address user) {
        require(
            block.timestamp >= lastExerciseTime[user] + 1 days,
            "Daily exercise already completed"
        );
        _;
    }
    
    /**
     * @dev Constructor initializes the token with roles
     */
    constructor() ERC20("DRSTCoin", "DRST") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mint tokens for completing an eye test
     * @param user Address of the user who completed the test
     */
    function rewardEyeTest(address user)
        external
        onlyRole(MINTER_ROLE)
        validAddress(user)
        whenNotPaused
        nonReentrant
    {
        _mint(user, EYE_TEST_REWARD);
        totalEyeTests[user]++;
        
        emit RewardMinted(user, EYE_TEST_REWARD, "eye_test");
    }
    
    /**
     * @dev Mint tokens for completing daily eye exercises
     * @param user Address of the user who completed exercises
     */
    function rewardDailyExercise(address user)
        external
        onlyRole(MINTER_ROLE)
        validAddress(user)
        whenNotPaused
        onlyOncePerDay(user)
        nonReentrant
    {
        _mint(user, DAILY_EXERCISE_REWARD);
        lastExerciseTime[user] = block.timestamp;
        totalExercises[user]++;
        
        emit RewardMinted(user, DAILY_EXERCISE_REWARD, "daily_exercise");
    }
    
    /**
     * @dev Mint tokens for adding a family member
     * @param user Address of the user who added a family member
     */
    function rewardFamilyMember(address user)
        external
        onlyRole(MINTER_ROLE)
        validAddress(user)
        whenNotPaused
        nonReentrant
    {
        _mint(user, FAMILY_MEMBER_REWARD);
        familyMembersAdded[user]++;
        
        emit RewardMinted(user, FAMILY_MEMBER_REWARD, "family_member");
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
     * @dev Redeem tokens for doctor visit discount
     * @param tokensToSpend Amount of tokens to spend
     * @return discountPercent Percentage discount earned
     */
    function redeemForDiscount(uint256 tokensToSpend)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 discountPercent)
    {
        require(tokensToSpend > 0, "Must spend more than 0 tokens");
        require(balanceOf(msg.sender) >= tokensToSpend, "Insufficient balance");
        
        discountPercent = tokensToSpend / DISCOUNT_RATE;
        require(discountPercent > 0, "Insufficient tokens for discount");
        require(discountPercent <= 50, "Maximum 50% discount allowed");
        
        _burn(msg.sender, tokensToSpend);
        discountBalance[msg.sender] += discountPercent;
        
        emit DiscountApplied(msg.sender, tokensToSpend, discountPercent);
        
        return discountPercent;
    }
    
    /**
     * @dev Use accumulated discount
     * @param discountToUse Percentage of discount to use
     */
    function useDiscount(uint256 discountToUse)
        external
        whenNotPaused
        nonReentrant
    {
        require(discountToUse > 0, "Must use more than 0% discount");
        require(discountBalance[msg.sender] >= discountToUse, "Insufficient discount balance");
        
        discountBalance[msg.sender] -= discountToUse;
        
        emit TokensRedeemed(msg.sender, discountToUse, "doctor_visit_discount");
    }
    
    /**
     * @dev Get user's activity statistics
     * @param user Address of the user
     * @return eyeTests Number of eye tests completed
     * @return exercises Number of daily exercises completed
     * @return familyMembers Number of family members added
     * @return availableDiscount Available discount percentage
     */
    function getUserStats(address user)
        external
        view
        returns (
            uint256 eyeTests,
            uint256 exercises,
            uint256 familyMembers,
            uint256 availableDiscount
        )
    {
        return (
            totalEyeTests[user],
            totalExercises[user],
            familyMembersAdded[user],
            discountBalance[user]
        );
    }
    
    /**
     * @dev Check if user can do daily exercise today
     * @param user Address of the user
     * @return canExercise Boolean indicating if exercise is available
     */
    function canDoExerciseToday(address user) external view returns (bool canExercise) {
        return block.timestamp >= lastExerciseTime[user] + 1 days;
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
