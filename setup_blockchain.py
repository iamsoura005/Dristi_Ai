#!/usr/bin/env python3
"""
Dristi AI Blockchain Setup Script
Automates the setup and deployment of blockchain features
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🚀 DRISTI AI BLOCKCHAIN SETUP")
    print("=" * 60)
    print("Setting up blockchain features for Dristi AI...")
    print("This will deploy smart contracts and configure services.\n")

def check_requirements():
    """Check if all requirements are installed"""
    print("📋 Checking requirements...")

    # Check Node.js and npm
    try:
        node_result = subprocess.run(['node', '--version'], capture_output=True, text=True, shell=True)
        npm_result = subprocess.run(['npm', '--version'], capture_output=True, text=True, shell=True)

        if node_result.returncode == 0 and npm_result.returncode == 0:
            node_version = node_result.stdout.strip()
            npm_version = npm_result.stdout.strip()
            print(f"✅ Node.js: {node_version}")
            print(f"✅ npm: {npm_version}")
        else:
            print("❌ Node.js and npm are required. Please install them first.")
            return False
    except Exception as e:
        print(f"❌ Error checking Node.js/npm: {e}")
        return False
    
    # Check Python packages
    try:
        import web3
        import cryptography
        import requests
        print("✅ Python blockchain packages installed")
    except ImportError as e:
        print(f"❌ Missing Python package: {e}")
        print("Run: pip install web3 cryptography requests")
        return False
    
    return True

def setup_hardhat():
    """Setup Hardhat development environment"""
    print("\n🔧 Setting up Hardhat...")
    
    blockchain_dir = Path("blockchain")
    if not blockchain_dir.exists():
        print("❌ Blockchain directory not found")
        return False
    
    os.chdir(blockchain_dir)
    
    # Install dependencies
    print("📦 Installing Hardhat dependencies...")
    result = subprocess.run(['npm', 'install'], capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"❌ Failed to install dependencies: {result.stderr}")
        return False
    
    print("✅ Hardhat setup complete")
    os.chdir("..")
    return True

def compile_contracts():
    """Compile smart contracts"""
    print("\n🔨 Compiling smart contracts...")
    
    os.chdir("blockchain")
    
    result = subprocess.run(['npx', 'hardhat', 'compile'], capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"❌ Compilation failed: {result.stderr}")
        os.chdir("..")
        return False
    
    print("✅ Smart contracts compiled successfully")
    os.chdir("..")
    return True

def run_tests():
    """Run smart contract tests"""
    print("\n🧪 Running smart contract tests...")
    
    os.chdir("blockchain")
    
    result = subprocess.run(['npx', 'hardhat', 'test'], capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"❌ Tests failed: {result.stderr}")
        print("Please fix the issues before proceeding.")
        os.chdir("..")
        return False
    
    print("✅ All tests passed")
    os.chdir("..")
    return True

def deploy_contracts():
    """Deploy smart contracts to local network"""
    print("\n🚀 Deploying smart contracts...")
    
    os.chdir("blockchain")
    
    # Start local Hardhat network in background
    print("🌐 Starting local Hardhat network...")
    hardhat_process = subprocess.Popen(
        ['npx', 'hardhat', 'node'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for network to start
    import time
    time.sleep(5)
    
    try:
        # Deploy contracts
        print("📄 Deploying contracts to local network...")
        result = subprocess.run(
            ['npx', 'hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Deployment failed: {result.stderr}")
            return False
        
        print("✅ Contracts deployed successfully")
        print(result.stdout)
        
        # Save deployment info
        if os.path.exists('.env.contracts'):
            print("📝 Contract addresses saved to .env.contracts")
        
    finally:
        # Stop Hardhat network
        hardhat_process.terminate()
        hardhat_process.wait()
    
    os.chdir("..")
    return True

def setup_database():
    """Setup database tables for blockchain"""
    print("\n🗄️ Setting up database...")
    
    try:
        # Run database migration
        result = subprocess.run(
            [sys.executable, 'backend/migrations/add_blockchain_tables.py'],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Database setup failed: {result.stderr}")
            return False
        
        print("✅ Database tables created successfully")
        print(result.stdout)
        
    except Exception as e:
        print(f"❌ Database setup error: {str(e)}")
        return False
    
    return True

def setup_ipfs():
    """Setup IPFS for decentralized storage"""
    print("\n📁 Setting up IPFS...")
    
    # Check if IPFS is installed
    try:
        ipfs_version = subprocess.check_output(['ipfs', 'version'], text=True).strip()
        print(f"✅ IPFS installed: {ipfs_version}")
        
        # Initialize IPFS if needed
        result = subprocess.run(['ipfs', 'init'], capture_output=True, text=True)
        if "already exists" in result.stderr:
            print("✅ IPFS already initialized")
        else:
            print("✅ IPFS initialized")
        
        # Start IPFS daemon
        print("🌐 Starting IPFS daemon...")
        print("Note: IPFS daemon will run in the background")
        subprocess.Popen(['ipfs', 'daemon'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        return True
        
    except FileNotFoundError:
        print("⚠️ IPFS not found. Please install IPFS:")
        print("   Visit: https://docs.ipfs.io/install/")
        print("   Or use: npm install -g ipfs")
        return False

def create_env_file():
    """Create environment file with blockchain configuration"""
    print("\n📝 Creating environment configuration...")
    
    env_content = """
# Dristi AI Blockchain Configuration
# Update these values after deploying to testnet/mainnet

# Ethereum Configuration
ETHEREUM_NETWORK=localhost
ETHEREUM_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337

# Smart Contract Addresses (update after deployment)
DRST_COIN_ADDRESS=
VISION_COIN_ADDRESS=
HEALTH_PASSPORT_ADDRESS=
ACHIEVEMENT_NFT_ADDRESS=

# IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Bitcoin Configuration
BITCOIN_NETWORK=testnet
BLOCKCYPHER_TOKEN=your_blockcypher_token_here

# Security
JWT_SECRET_KEY=your_jwt_secret_key_here

# Gas Configuration
GAS_PRICE_GWEI=20
"""
    
    with open('.env.blockchain', 'w') as f:
        f.write(env_content.strip())
    
    print("✅ Environment file created: .env.blockchain")
    print("📝 Please update the configuration values as needed")

def main():
    """Main setup function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Setup failed. Please install missing requirements.")
        return False
    
    # Setup steps
    steps = [
        ("Setup Hardhat", setup_hardhat),
        ("Compile Contracts", compile_contracts),
        ("Run Tests", run_tests),
        ("Deploy Contracts", deploy_contracts),
        ("Setup Database", setup_database),
        ("Setup IPFS", setup_ipfs),
        ("Create Environment File", create_env_file),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{'='*20} {step_name} {'='*20}")
        if not step_func():
            print(f"\n❌ Setup failed at step: {step_name}")
            return False
    
    # Success message
    print("\n" + "="*60)
    print("🎉 BLOCKCHAIN SETUP COMPLETED SUCCESSFULLY!")
    print("="*60)
    print("\n📋 Next Steps:")
    print("1. Update .env.blockchain with your API keys")
    print("2. For testnet deployment, run: cd blockchain && npx hardhat run scripts/deploy.js --network goerli")
    print("3. Start the backend server: cd backend && python app.py")
    print("4. Start the frontend: cd frontend && npm run dev")
    print("5. Access the wallet at: http://localhost:3000/wallet")
    print("\n🔗 Useful Commands:")
    print("- Test contracts: cd blockchain && npx hardhat test")
    print("- Start local blockchain: cd blockchain && npx hardhat node")
    print("- Deploy to testnet: cd blockchain && npx hardhat run scripts/deploy.js --network goerli")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
