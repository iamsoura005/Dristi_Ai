const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Dristi AI Smart Contracts", function () {
  let owner, user1, user2, doctor, charity;
  let drstCoin, visionCoin, healthPassport, achievementNFT;
  
  beforeEach(async function () {
    [owner, user1, user2, doctor, charity] = await ethers.getSigners();

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

  describe("DRSTCoin", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await drstCoin.totalSupply();
      expect(totalSupply).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("Should mint tokens for eye test completion", async function () {
      await drstCoin.mintForEyeTest(user1.address);
      const balance = await drstCoin.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should mint tokens for daily exercise", async function () {
      await drstCoin.mintForDailyExercise(user1.address);
      const balance = await drstCoin.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("5"));
    });

    it("Should mint tokens for family member addition", async function () {
      await drstCoin.mintForFamilyMember(user1.address);
      const balance = await drstCoin.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("20"));
    });

    it("Should track daily exercise correctly", async function () {
      await drstCoin.mintForDailyExercise(user1.address);
      const lastExercise = await drstCoin.lastExerciseDate(user1.address);
      expect(lastExercise).to.be.gt(0);
    });

    it("Should not allow double exercise rewards on same day", async function () {
      await drstCoin.mintForDailyExercise(user1.address);
      await expect(drstCoin.mintForDailyExercise(user1.address))
        .to.be.revertedWith("Already exercised today");
    });

    it("Should apply discount for token holders", async function () {
      await drstCoin.mintForEyeTest(user1.address);
      const discount = await drstCoin.getDoctorVisitDiscount(user1.address);
      expect(discount).to.be.gt(0);
    });

    it("Should pause and unpause correctly", async function () {
      await drstCoin.pause();
      await expect(drstCoin.mintForEyeTest(user1.address))
        .to.be.revertedWith("Pausable: paused");
      
      await drstCoin.unpause();
      await drstCoin.mintForEyeTest(user1.address);
      const balance = await drstCoin.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("VisionCoin", function () {
    it("Should mint tokens based on health condition", async function () {
      // Normal condition
      await visionCoin.mintBasedOnHealth(user1.address, 0, 95);
      let balance = await visionCoin.balanceOf(user1.address);
      expect(balance).to.equal(ethers.utils.parseEther("10"));
      
      // Mild abnormality
      await visionCoin.mintBasedOnHealth(user2.address, 1, 75);
      balance = await visionCoin.balanceOf(user2.address);
      expect(balance).to.equal(ethers.utils.parseEther("5"));
    });

    it("Should track health history", async function () {
      await visionCoin.mintBasedOnHealth(user1.address, 0, 95);
      const history = await visionCoin.getHealthHistory(user1.address);
      expect(history.length).to.equal(1);
      expect(history[0].condition).to.equal(0);
      expect(history[0].confidence).to.equal(95);
    });

    it("Should calculate health statistics", async function () {
      await visionCoin.mintBasedOnHealth(user1.address, 0, 95);
      await visionCoin.mintBasedOnHealth(user1.address, 1, 80);
      
      const stats = await visionCoin.getHealthStatistics(user1.address);
      expect(stats.totalTests).to.equal(2);
      expect(stats.normalCount).to.equal(1);
      expect(stats.mildCount).to.equal(1);
      expect(stats.severeCount).to.equal(0);
    });

    it("Should not mint for severe abnormalities", async function () {
      await visionCoin.mintBasedOnHealth(user1.address, 2, 90);
      const balance = await visionCoin.balanceOf(user1.address);
      expect(balance).to.equal(0);
    });
  });

  describe("DigitalHealthPassport", function () {
    it("Should store health record", async function () {
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeHealthRecord(user1.address, ipfsHash, "eye_test");
      
      const recordCount = await healthPassport.getRecordCount(user1.address);
      expect(recordCount).to.equal(1);
      
      const record = await healthPassport.getRecord(user1.address, 0);
      expect(record.ipfsHash).to.equal(ipfsHash);
      expect(record.recordType).to.equal("eye_test");
      expect(record.isActive).to.be.true;
    });

    it("Should allow emergency doctor access", async function () {
      await healthPassport.addEmergencyDoctor(doctor.address);
      
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeHealthRecord(user1.address, ipfsHash, "eye_test");
      
      const record = await healthPassport.connect(doctor).getRecord(user1.address, 0);
      expect(record.ipfsHash).to.equal(ipfsHash);
    });

    it("Should not allow unauthorized access", async function () {
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeHealthRecord(user1.address, ipfsHash, "eye_test");
      
      await expect(healthPassport.connect(user2).getRecord(user1.address, 0))
        .to.be.revertedWith("Not authorized to access this record");
    });

    it("Should deactivate records", async function () {
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeHealthRecord(user1.address, ipfsHash, "eye_test");
      
      await healthPassport.connect(user1).deactivateRecord(0);
      
      const record = await healthPassport.connect(user1).getRecord(user1.address, 0);
      expect(record.isActive).to.be.false;
    });
  });

  describe("AchievementNFT", function () {
    it("Should mint achievement NFT", async function () {
      const tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";
      await achievementNFT.mintAchievement(user1.address, 0, tokenURI);
      
      const balance = await achievementNFT.balanceOf(user1.address);
      expect(balance).to.equal(1);
      
      const tokenId = await achievementNFT.tokenOfOwnerByIndex(user1.address, 0);
      const achievement = await achievementNFT.getAchievement(tokenId);
      expect(achievement.achievementType).to.equal(0);
      expect(achievement.recipient).to.equal(user1.address);
    });

    it("Should handle charity donations on sales", async function () {
      const tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";
      await achievementNFT.mintAchievement(user1.address, 0, tokenURI);
      
      const tokenId = await achievementNFT.tokenOfOwnerByIndex(user1.address, 0);
      
      // Simulate sale (this would normally happen through marketplace)
      const salePrice = ethers.utils.parseEther("1");
      await achievementNFT.connect(user1).recordSale(tokenId, salePrice);
      
      const charityBalance = await ethers.provider.getBalance(charity.address);
      // Note: In a real test, we'd need to track the balance change
    });

    it("Should prevent unauthorized minting", async function () {
      const tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";
      await expect(achievementNFT.connect(user1).mintAchievement(user1.address, 0, tokenURI))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should return correct achievement metadata", async function () {
      const tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";
      await achievementNFT.mintAchievement(user1.address, 0, tokenURI);
      
      const tokenId = await achievementNFT.tokenOfOwnerByIndex(user1.address, 0);
      const uri = await achievementNFT.tokenURI(tokenId);
      expect(uri).to.equal(tokenURI);
    });
  });

  describe("Integration Tests", function () {
    it("Should work together for complete user journey", async function () {
      // User completes eye test
      await drstCoin.mintForEyeTest(user1.address);
      await visionCoin.mintBasedOnHealth(user1.address, 0, 95);
      
      // Store health record
      const ipfsHash = "QmTestHash123";
      await healthPassport.storeHealthRecord(user1.address, ipfsHash, "eye_test");
      
      // Mint achievement NFT
      const tokenURI = "https://ipfs.io/ipfs/QmTestMetadata";
      await achievementNFT.mintAchievement(user1.address, 0, tokenURI);
      
      // Verify all balances and records
      const drstBalance = await drstCoin.balanceOf(user1.address);
      const vscBalance = await visionCoin.balanceOf(user1.address);
      const nftBalance = await achievementNFT.balanceOf(user1.address);
      const recordCount = await healthPassport.getRecordCount(user1.address);
      
      expect(drstBalance).to.equal(ethers.utils.parseEther("50"));
      expect(vscBalance).to.equal(ethers.utils.parseEther("10"));
      expect(nftBalance).to.equal(1);
      expect(recordCount).to.equal(1);
    });
  });
});
