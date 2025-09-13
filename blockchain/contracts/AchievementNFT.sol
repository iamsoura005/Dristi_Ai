// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AchievementNFT
 * @dev ERC-721 NFT contract for Dristi AI achievement badges
 * @notice Users earn unique NFT badges for completing achievements
 */
contract AchievementNFT is 
    ERC721, 
    ERC721URIStorage, 
    ERC721Enumerable, 
    AccessControl, 
    ReentrancyGuard 
{
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Counter for token IDs
    Counters.Counter private _tokenIdCounter;
    
    // Charity address for donations
    address public charityAddress;
    uint256 public constant CHARITY_PERCENTAGE = 20; // 20% of proceeds
    
    // Achievement types
    enum AchievementType {
        FIRST_EYE_TEST,
        VISION_IMPROVED,
        FAMILY_COMPLETE,
        HEALTH_CHAMPION,
        EARLY_DETECTOR,
        WELLNESS_WARRIOR
    }
    
    // Achievement metadata
    struct Achievement {
        AchievementType achievementType;
        string name;
        string description;
        string imageURI;
        uint256 mintedAt;
        address recipient;
    }
    
    // Mappings
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(AchievementType => bool)) public userAchievements;
    mapping(address => uint256[]) public userTokens;
    mapping(AchievementType => uint256) public achievementCounts;
    mapping(AchievementType => string) public achievementMetadata;
    
    // Sales tracking
    uint256 public totalSales;
    uint256 public charityDonations;
    
    // Events
    event AchievementMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        AchievementType achievementType,
        string name
    );
    
    event CharityDonation(uint256 amount, address charityAddress);
    event AchievementSold(uint256 indexed tokenId, uint256 price, address buyer);
    
    // Modifiers
    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }
    
    modifier achievementNotEarned(address user, AchievementType achievementType) {
        require(
            !userAchievements[user][achievementType],
            "Achievement already earned"
        );
        _;
    }
    
    /**
     * @dev Constructor initializes the NFT contract
     * @param _charityAddress Address to receive charity donations
     */
    constructor(address _charityAddress) 
        ERC721("Dristi Achievement Badges", "DAB") 
        validAddress(_charityAddress)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        
        charityAddress = _charityAddress;
        
        // Initialize achievement metadata
        _initializeAchievementMetadata();
    }
    
    /**
     * @dev Initialize achievement metadata
     */
    function _initializeAchievementMetadata() internal {
        achievementMetadata[AchievementType.FIRST_EYE_TEST] = "First Eye Test Badge";
        achievementMetadata[AchievementType.VISION_IMPROVED] = "Vision Improved Trophy";
        achievementMetadata[AchievementType.FAMILY_COMPLETE] = "Family Complete Certificate";
        achievementMetadata[AchievementType.HEALTH_CHAMPION] = "Health Champion Medal";
        achievementMetadata[AchievementType.EARLY_DETECTOR] = "Early Detector Award";
        achievementMetadata[AchievementType.WELLNESS_WARRIOR] = "Wellness Warrior Badge";
    }
    
    /**
     * @dev Mint achievement NFT to user
     * @param recipient Address to receive the NFT
     * @param achievementType Type of achievement
     * @param imageURI IPFS URI for the achievement image
     * @param description Description of the achievement
     */
    function mintAchievement(
        address recipient,
        AchievementType achievementType,
        string memory imageURI,
        string memory description
    )
        public
        onlyRole(MINTER_ROLE)
        validAddress(recipient)
        achievementNotEarned(recipient, achievementType)
        nonReentrant
        returns (uint256)
    {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        
        // Create achievement
        Achievement memory newAchievement = Achievement({
            achievementType: achievementType,
            name: achievementMetadata[achievementType],
            description: description,
            imageURI: imageURI,
            mintedAt: block.timestamp,
            recipient: recipient
        });
        
        // Store achievement data
        achievements[newTokenId] = newAchievement;
        userAchievements[recipient][achievementType] = true;
        userTokens[recipient].push(newTokenId);
        achievementCounts[achievementType]++;
        
        // Mint NFT
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, imageURI);
        
        emit AchievementMinted(
            recipient,
            newTokenId,
            achievementType,
            achievementMetadata[achievementType]
        );
        
        return newTokenId;
    }

    /**
     * @dev Mint First Eye Test achievement
     * @param recipient Address to receive the NFT
     * @param imageURI IPFS URI for the achievement image
     */
    function mintFirstEyeTestAchievement(address recipient, string memory imageURI)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        return mintAchievement(
            recipient,
            AchievementType.FIRST_EYE_TEST,
            imageURI,
            "Congratulations on completing your first eye test with Dristi AI!"
        );
    }

    /**
     * @dev Mint Vision Improved achievement
     * @param recipient Address to receive the NFT
     * @param imageURI IPFS URI for the achievement image
     */
    function mintVisionImprovedAchievement(address recipient, string memory imageURI)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        return mintAchievement(
            recipient,
            AchievementType.VISION_IMPROVED,
            imageURI,
            "Your vision health has improved! Keep up the great work!"
        );
    }

    /**
     * @dev Mint Family Complete achievement
     * @param recipient Address to receive the NFT
     * @param imageURI IPFS URI for the achievement image
     */
    function mintFamilyCompleteAchievement(address recipient, string memory imageURI)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        return mintAchievement(
            recipient,
            AchievementType.FAMILY_COMPLETE,
            imageURI,
            "You've successfully added all your family members to Dristi AI!"
        );
    }

    /**
     * @dev Get user's achievements
     * @param user Address of the user
     * @return Array of token IDs owned by the user
     */
    function getUserAchievements(address user)
        external
        view
        returns (uint256[] memory)
    {
        return userTokens[user];
    }
    
    /**
     * @dev Check if user has specific achievement
     * @param user Address of the user
     * @param achievementType Type of achievement to check
     * @return Boolean indicating if user has the achievement
     */
    function hasAchievement(address user, AchievementType achievementType)
        external
        view
        returns (bool)
    {
        return userAchievements[user][achievementType];
    }
    
    /**
     * @dev Get achievement details by token ID
     * @param tokenId ID of the token
     * @return Achievement struct
     */
    function getAchievement(uint256 tokenId)
        external
        view
        returns (Achievement memory)
    {
        require(_exists(tokenId), "Achievement does not exist");
        return achievements[tokenId];
    }
    
    /**
     * @dev Get achievement statistics
     * @return totalMinted Total number of achievements minted
     * @return firstEyeTest Number of First Eye Test badges
     * @return visionImproved Number of Vision Improved trophies
     * @return familyComplete Number of Family Complete certificates
     */
    function getAchievementStats()
        external
        view
        returns (
            uint256 totalMinted,
            uint256 firstEyeTest,
            uint256 visionImproved,
            uint256 familyComplete
        )
    {
        return (
            _tokenIdCounter.current(),
            achievementCounts[AchievementType.FIRST_EYE_TEST],
            achievementCounts[AchievementType.VISION_IMPROVED],
            achievementCounts[AchievementType.FAMILY_COMPLETE]
        );
    }
    
    /**
     * @dev Handle NFT sales with charity donation
     * @param tokenId ID of the token being sold
     * @param salePrice Price of the sale
     */
    function handleSale(uint256 tokenId, uint256 salePrice)
        external
        payable
        nonReentrant
    {
        require(_exists(tokenId), "Token does not exist");
        require(msg.value == salePrice, "Incorrect payment amount");
        
        uint256 charityAmount = (salePrice * CHARITY_PERCENTAGE) / 100;
        uint256 sellerAmount = salePrice - charityAmount;
        
        // Transfer to charity
        if (charityAmount > 0) {
            payable(charityAddress).transfer(charityAmount);
            charityDonations += charityAmount;
            emit CharityDonation(charityAmount, charityAddress);
        }
        
        // Transfer to seller
        address seller = ownerOf(tokenId);
        payable(seller).transfer(sellerAmount);
        
        totalSales += salePrice;
        
        emit AchievementSold(tokenId, salePrice, msg.sender);
    }
    
    /**
     * @dev Update charity address
     * @param newCharityAddress New charity address
     */
    function updateCharityAddress(address newCharityAddress)
        external
        onlyRole(ADMIN_ROLE)
        validAddress(newCharityAddress)
    {
        charityAddress = newCharityAddress;
    }
    
    // Required overrides
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
