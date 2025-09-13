const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Basic Smart Contract Tests", function () {
  let owner, user1, charity;
  let drstCoin, visionCoin, healthPassport, achievementNFT;
  
  beforeEach(async function () {
    [owner, user1, charity] = await ethers.getSigners();
    
    // Deploy DRSTCoin
    const DRSTCoin = await ethers.getContractFactory("DRSTCoin");
    drstCoin = await DRSTCoin.deploy();
    await drstCoin.waitForDeployment();
    
    // Deploy VisionCoin
    const VisionCoin = await ethers.getContractFactory("VisionCoin");
    visionCoin = await VisionCoin.deploy();
    await visionCoin.waitForDeployment();
    
    // Deploy DigitalHealthPassport
    const DigitalHealthPassport = await ethers.getContractFactory("DigitalHealthPassport");
    healthPassport = await DigitalHealthPassport.deploy();
    await healthPassport.waitForDeployment();
    
    // Deploy AchievementNFT
    const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
    achievementNFT = await AchievementNFT.deploy(charity.address);
    await achievementNFT.waitForDeployment();
  });

  describe("Contract Deployment", function () {
    it("Should deploy DRSTCoin successfully", async function () {
      expect(await drstCoin.getAddress()).to.be.properAddress;
      expect(await drstCoin.name()).to.equal("Dristi Coin");
      expect(await drstCoin.symbol()).to.equal("DRST");
    });

    it("Should deploy VisionCoin successfully", async function () {
      expect(await visionCoin.getAddress()).to.be.properAddress;
      expect(await visionCoin.name()).to.equal("VisionCoin");
      expect(await visionCoin.symbol()).to.equal("VSC");
    });

    it("Should deploy DigitalHealthPassport successfully", async function () {
      expect(await healthPassport.getAddress()).to.be.properAddress;
    });

    it("Should deploy AchievementNFT successfully", async function () {
      expect(await achievementNFT.getAddress()).to.be.properAddress;
      expect(await achievementNFT.name()).to.equal("Dristi AI Achievement");
      expect(await achievementNFT.symbol()).to.equal("DRST-NFT");
    });
  });

  describe("Basic Token Functions", function () {
    it("Should have correct initial supply for DRST", async function () {
      const totalSupply = await drstCoin.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000"));
    });

    it("Should have zero initial supply for VSC", async function () {
      const totalSupply = await visionCoin.totalSupply();
      expect(totalSupply).to.equal(0);
    });

    it("Should allow owner to mint DRST tokens", async function () {
      const amount = ethers.parseEther("100");
      await drstCoin.mint(user1.address, amount);
      const balance = await drstCoin.balanceOf(user1.address);
      expect(balance).to.equal(amount);
    });

    it("Should allow owner to mint VSC tokens", async function () {
      const amount = ethers.parseEther("50");
      await visionCoin.mint(user1.address, amount);
      const balance = await visionCoin.balanceOf(user1.address);
      expect(balance).to.equal(amount);
    });
  });

  describe("Access Control", function () {
    it("Should have correct roles for DRST", async function () {
      const DEFAULT_ADMIN_ROLE = await drstCoin.DEFAULT_ADMIN_ROLE();
      expect(await drstCoin.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct roles for VSC", async function () {
      const DEFAULT_ADMIN_ROLE = await visionCoin.DEFAULT_ADMIN_ROLE();
      expect(await visionCoin.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct roles for Achievement NFT", async function () {
      const DEFAULT_ADMIN_ROLE = await achievementNFT.DEFAULT_ADMIN_ROLE();
      expect(await achievementNFT.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Health Passport Basic Functions", function () {
    it("Should allow storing health records", async function () {
      const ipfsHash = "QmTestHash123";
      const recordType = "eye_test";
      
      await healthPassport.storeRecord(user1.address, ipfsHash, recordType);
      
      const recordCount = await healthPassport.getRecordCount(user1.address);
      expect(recordCount).to.equal(1);
    });

    it("Should retrieve stored health records", async function () {
      const ipfsHash = "QmTestHash123";
      const recordType = "eye_test";
      
      await healthPassport.storeRecord(user1.address, ipfsHash, recordType);
      
      const record = await healthPassport.getRecord(user1.address, 0);
      expect(record.ipfsHash).to.equal(ipfsHash);
      expect(record.recordType).to.equal(recordType);
      expect(record.isActive).to.be.true;
    });
  });

  describe("Achievement NFT Basic Functions", function () {
    it("Should mint achievement NFT", async function () {
      const imageURI = "https://ipfs.io/ipfs/QmTestMetadata";
      
      // Grant minter role to owner
      const MINTER_ROLE = await achievementNFT.MINTER_ROLE();
      await achievementNFT.grantRole(MINTER_ROLE, owner.address);
      
      // Mint achievement
      await achievementNFT.mintFirstEyeTestAchievement(user1.address, imageURI);
      
      const balance = await achievementNFT.balanceOf(user1.address);
      expect(balance).to.equal(1);
    });

    it("Should track user achievements", async function () {
      const imageURI = "https://ipfs.io/ipfs/QmTestMetadata";
      
      // Grant minter role to owner
      const MINTER_ROLE = await achievementNFT.MINTER_ROLE();
      await achievementNFT.grantRole(MINTER_ROLE, owner.address);
      
      // Mint achievement
      await achievementNFT.mintFirstEyeTestAchievement(user1.address, imageURI);
      
      const achievements = await achievementNFT.getUserAchievements(user1.address);
      expect(achievements.length).to.equal(1);
    });
  });

  describe("Integration Test", function () {
    it("Should work together for basic user journey", async function () {
      // Mint some DRST tokens
      const drstAmount = ethers.parseEther("50");
      await drstCoin.mint(user1.address, drstAmount);
      
      // Mint some VSC tokens
      const vscAmount = ethers.parseEther("10");
      await visionCoin.mint(user1.address, vscAmount);
      
      // Store health record
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeRecord(user1.address, ipfsHash, "eye_test");
      
      // Mint achievement NFT
      const MINTER_ROLE = await achievementNFT.MINTER_ROLE();
      await achievementNFT.grantRole(MINTER_ROLE, owner.address);
      await achievementNFT.mintFirstEyeTestAchievement(user1.address, "https://ipfs.io/ipfs/QmTest");
      
      // Verify all balances and records
      const drstBalance = await drstCoin.balanceOf(user1.address);
      const vscBalance = await visionCoin.balanceOf(user1.address);
      const nftBalance = await achievementNFT.balanceOf(user1.address);
      const recordCount = await healthPassport.getRecordCount(user1.address);
      
      expect(drstBalance).to.equal(drstAmount);
      expect(vscBalance).to.equal(vscAmount);
      expect(nftBalance).to.equal(1);
      expect(recordCount).to.equal(1);
    });
  });
});
