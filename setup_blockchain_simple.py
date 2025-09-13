#!/usr/bin/env python3
"""
Simplified Dristi AI Blockchain Setup Script
Step-by-step setup for Windows compatibility
"""

import os
import sys
import subprocess
from pathlib import Path

def print_step(step_num, title):
    """Print step header"""
    print(f"\n{'='*10} Step {step_num}: {title} {'='*10}")

def run_command(command, cwd=None, shell=True):
    """Run command and return success status"""
    try:
        print(f"Running: {command}")
        result = subprocess.run(command, shell=shell, cwd=cwd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Success!")
            if result.stdout.strip():
                print(result.stdout)
            return True
        else:
            print(f"❌ Failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 DRISTI AI BLOCKCHAIN SETUP (Simplified)")
    print("=" * 50)
    
    # Get current directory
    root_dir = Path.cwd()
    blockchain_dir = root_dir / "blockchain"
    backend_dir = root_dir / "backend"
    
    print(f"📁 Working directory: {root_dir}")
    
    # Step 1: Check Node.js and npm
    print_step(1, "Check Requirements")
    
    if not run_command("node --version"):
        print("❌ Node.js not found. Please install Node.js from https://nodejs.org/")
        return False
    
    if not run_command("npm --version"):
        print("❌ npm not found. Please install npm")
        return False
    
    # Step 2: Setup blockchain directory
    print_step(2, "Setup Blockchain Directory")
    
    if not blockchain_dir.exists():
        print("❌ Blockchain directory not found")
        return False
    
    # Step 3: Install Hardhat dependencies
    print_step(3, "Install Dependencies")
    
    if not run_command("npm install", cwd=blockchain_dir):
        print("❌ Failed to install npm dependencies")
        return False
    
    # Step 4: Compile contracts
    print_step(4, "Compile Smart Contracts")
    
    if not run_command("npx hardhat compile", cwd=blockchain_dir):
        print("❌ Failed to compile contracts")
        return False
    
    # Step 5: Run tests
    print_step(5, "Run Tests")
    
    if not run_command("npx hardhat test", cwd=blockchain_dir):
        print("⚠️ Tests failed, but continuing...")
    
    # Step 6: Create database tables
    print_step(6, "Setup Database")
    
    migration_script = backend_dir / "migrations" / "add_blockchain_tables.py"
    if migration_script.exists():
        if not run_command(f"python {migration_script}", cwd=root_dir):
            print("⚠️ Database setup failed, but continuing...")
    else:
        print("⚠️ Migration script not found, skipping database setup")
    
    # Step 7: Create environment file
    print_step(7, "Create Environment File")
    
    env_content = """# Dristi AI Blockchain Configuration
ETHEREUM_NETWORK=localhost
ETHEREUM_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
DRST_COIN_ADDRESS=
VISION_COIN_ADDRESS=
HEALTH_PASSPORT_ADDRESS=
ACHIEVEMENT_NFT_ADDRESS=
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
BITCOIN_NETWORK=testnet
BLOCKCYPHER_TOKEN=your_token_here
JWT_SECRET_KEY=your_jwt_secret_here
GAS_PRICE_GWEI=20
"""
    
    env_file = root_dir / ".env.blockchain"
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        print(f"✅ Created {env_file}")
    except Exception as e:
        print(f"❌ Failed to create env file: {e}")
    
    # Success message
    print("\n" + "="*50)
    print("🎉 BASIC SETUP COMPLETED!")
    print("="*50)
    print("\n📋 Next Steps:")
    print("1. To deploy contracts locally:")
    print("   cd blockchain")
    print("   npx hardhat node  # In one terminal")
    print("   npx hardhat run scripts/deploy.js --network localhost  # In another")
    print("\n2. To start the application:")
    print("   cd backend && python app.py  # Start backend")
    print("   cd frontend && npm run dev   # Start frontend")
    print("\n3. Access wallet at: http://localhost:3000/wallet")
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n✅ Setup completed successfully!")
    else:
        print("\n❌ Setup failed. Please check the errors above.")
    
    input("\nPress Enter to continue...")
    sys.exit(0 if success else 1)
