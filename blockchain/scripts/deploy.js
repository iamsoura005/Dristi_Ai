const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Dristi AI Smart Contract Deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH\n");

  // Charity address for NFT proceeds (use deployer for testing)
  const charityAddress = deployer.address; // Use deployer address for testing

  try {
    // 1. Deploy DigitalHealthPassport
    console.log("📋 Deploying DigitalHealthPassport...");
    const DigitalHealthPassport = await ethers.getContractFactory("DigitalHealthPassport");
    const healthPassport = await DigitalHealthPassport.deploy();
    await healthPassport.waitForDeployment();
    console.log("✅ DigitalHealthPassport deployed to:", await healthPassport.getAddress());

    // 2. Deploy DRSTCoin
    console.log("\n🪙 Deploying DRSTCoin...");
    const DRSTCoin = await ethers.getContractFactory("DRSTCoin");
    const drstCoin = await DRSTCoin.deploy();
    await drstCoin.waitForDeployment();
    console.log("✅ DRSTCoin deployed to:", await drstCoin.getAddress());

    // 3. Deploy VisionCoin
    console.log("\n👁️ Deploying VisionCoin...");
    const VisionCoin = await ethers.getContractFactory("VisionCoin");
    const visionCoin = await VisionCoin.deploy();
    await visionCoin.waitForDeployment();
    console.log("✅ VisionCoin deployed to:", await visionCoin.getAddress());

    // 4. Deploy AchievementNFT
    console.log("\n🏆 Deploying AchievementNFT...");
    const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
    const achievementNFT = await AchievementNFT.deploy(charityAddress);
    await achievementNFT.waitForDeployment();
    console.log("✅ AchievementNFT deployed to:", await achievementNFT.getAddress());

    // Wait for confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    await healthPassport.deployTransaction.wait(5);
    await drstCoin.deployTransaction.wait(5);
    await visionCoin.deployTransaction.wait(5);
    await achievementNFT.deployTransaction.wait(5);

    // Create deployment info object
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        DigitalHealthPassport: {
          address: healthPassport.address,
          transactionHash: healthPassport.deployTransaction.hash
        },
        DRSTCoin: {
          address: drstCoin.address,
          transactionHash: drstCoin.deployTransaction.hash
        },
        VisionCoin: {
          address: visionCoin.address,
          transactionHash: visionCoin.deployTransaction.hash
        },
        AchievementNFT: {
          address: achievementNFT.address,
          transactionHash: achievementNFT.deployTransaction.hash,
          charityAddress: charityAddress
        }
      }
    };

    // Save deployment info
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Save ABI files for frontend integration
    const abisDir = path.join(__dirname, "../abis");
    if (!fs.existsSync(abisDir)) {
      fs.mkdirSync(abisDir, { recursive: true });
    }

    // Copy ABI files
    const artifactsDir = path.join(__dirname, "../artifacts/contracts");
    const contracts = ["DigitalHealthPassport", "DRSTCoin", "VisionCoin", "AchievementNFT"];
    
    contracts.forEach(contractName => {
      const artifactPath = path.join(artifactsDir, `${contractName}.sol`, `${contractName}.json`);
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const abiPath = path.join(abisDir, `${contractName}.json`);
        fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
      }
    });

    // Display deployment summary
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=" .repeat(60));
    console.log("📋 DigitalHealthPassport:", healthPassport.address);
    console.log("🪙 DRSTCoin:", drstCoin.address);
    console.log("👁️ VisionCoin:", visionCoin.address);
    console.log("🏆 AchievementNFT:", achievementNFT.address);
    console.log("💝 Charity Address:", charityAddress);
    console.log("=" .repeat(60));
    console.log("📁 Deployment info saved to:", deploymentFile);
    console.log("📄 ABI files saved to:", abisDir);

    // Verify contracts on Etherscan (if not local network)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("\n🔍 Verifying contracts on Etherscan...");
      
      try {
        await hre.run("verify:verify", {
          address: healthPassport.address,
          constructorArguments: [],
        });
        console.log("✅ DigitalHealthPassport verified");
      } catch (error) {
        console.log("❌ DigitalHealthPassport verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: drstCoin.address,
          constructorArguments: [],
        });
        console.log("✅ DRSTCoin verified");
      } catch (error) {
        console.log("❌ DRSTCoin verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: visionCoin.address,
          constructorArguments: [],
        });
        console.log("✅ VisionCoin verified");
      } catch (error) {
        console.log("❌ VisionCoin verification failed:", error.message);
      }

      try {
        await hre.run("verify:verify", {
          address: achievementNFT.address,
          constructorArguments: [charityAddress],
        });
        console.log("✅ AchievementNFT verified");
      } catch (error) {
        console.log("❌ AchievementNFT verification failed:", error.message);
      }
    }

    console.log("\n🚀 All contracts deployed and ready for integration!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
