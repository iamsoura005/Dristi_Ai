"""
Blockchain Configuration for Dristi AI
Contains all blockchain-related configuration settings
"""

import os
from typing import Dict, Any

class BlockchainConfig:
    """Configuration class for blockchain services"""
    
    # Network Configuration
    ETHEREUM_NETWORK = os.getenv('ETHEREUM_NETWORK', 'goerli')  # mainnet, goerli, sepolia, localhost
    ETHEREUM_RPC_URL = os.getenv('ETHEREUM_RPC_URL', 'https://goerli.infura.io/v3/YOUR_PROJECT_ID')
    CHAIN_ID = int(os.getenv('CHAIN_ID', '5'))  # 1 for mainnet, 5 for goerli, 11155111 for sepolia
    
    # Smart Contract Addresses (to be updated after deployment)
    DRST_COIN_ADDRESS = os.getenv('DRST_COIN_ADDRESS', '')
    VISION_COIN_ADDRESS = os.getenv('VISION_COIN_ADDRESS', '')
    HEALTH_PASSPORT_ADDRESS = os.getenv('HEALTH_PASSPORT_ADDRESS', '')
    ACHIEVEMENT_NFT_ADDRESS = os.getenv('ACHIEVEMENT_NFT_ADDRESS', '')
    
    # IPFS Configuration
    IPFS_API_URL = os.getenv('IPFS_API_URL', 'http://127.0.0.1:5001')
    IPFS_GATEWAY_URL = os.getenv('IPFS_GATEWAY_URL', 'https://ipfs.io/ipfs/')
    
    # Bitcoin Configuration
    BITCOIN_NETWORK = os.getenv('BITCOIN_NETWORK', 'testnet')  # mainnet, testnet
    BLOCKCYPHER_TOKEN = os.getenv('BLOCKCYPHER_TOKEN', '')
    BLOCKCYPHER_BASE_URL = os.getenv('BLOCKCYPHER_BASE_URL', 'https://api.blockcypher.com/v1/btc/test3')
    
    # Security Configuration
    ENCRYPTION_KEY_FILE = os.getenv('ENCRYPTION_KEY_FILE', '.master_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Token Economics
    TOKEN_REWARDS = {
        'eye_test': 50,      # DRST tokens for completing eye test
        'daily_exercise': 5,  # DRST tokens for daily exercise
        'family_member': 20,  # DRST tokens for adding family member
        'normal_vision': 10,  # VSC tokens for normal eye health
        'mild_abnormality': 5,  # VSC tokens for mild abnormality
        'severe_abnormality': 0  # No VSC tokens for severe abnormality
    }
    
    # Gas Configuration
    GAS_LIMIT = {
        'token_transfer': 21000,
        'token_mint': 100000,
        'nft_mint': 200000,
        'health_record': 150000
    }
    
    GAS_PRICE_GWEI = int(os.getenv('GAS_PRICE_GWEI', '20'))
    
    # Achievement Types for NFTs
    ACHIEVEMENT_TYPES = {
        0: {
            'name': 'First Eye Test',
            'description': 'Completed your first eye health analysis',
            'image': 'first_eye_test.png'
        },
        1: {
            'name': 'Vision Improved',
            'description': 'Showed improvement in eye health condition',
            'image': 'vision_improved.png'
        },
        2: {
            'name': 'Family Complete',
            'description': 'Added all family members to your account',
            'image': 'family_complete.png'
        },
        3: {
            'name': 'Health Champion',
            'description': 'Completed 10 health activities',
            'image': 'health_champion.png'
        },
        4: {
            'name': 'Early Detector',
            'description': 'Detected health issues early through regular testing',
            'image': 'early_detector.png'
        },
        5: {
            'name': 'Wellness Warrior',
            'description': 'Maintained consistent health monitoring for 30 days',
            'image': 'wellness_warrior.png'
        }
    }
    
    # Health Record Types
    HEALTH_RECORD_TYPES = [
        'eye_test',
        'prescription',
        'diagnosis',
        'treatment',
        'follow_up',
        'emergency'
    ]
    
    # Supported Cryptocurrencies
    SUPPORTED_CRYPTOS = {
        'ETH': {
            'name': 'Ethereum',
            'symbol': 'ETH',
            'decimals': 18,
            'type': 'native'
        },
        'DRST': {
            'name': 'Dristi Coin',
            'symbol': 'DRST',
            'decimals': 18,
            'type': 'erc20',
            'contract_address': DRST_COIN_ADDRESS
        },
        'VSC': {
            'name': 'VisionCoin',
            'symbol': 'VSC',
            'decimals': 18,
            'type': 'erc20',
            'contract_address': VISION_COIN_ADDRESS
        },
        'BTC': {
            'name': 'Bitcoin',
            'symbol': 'BTC',
            'decimals': 8,
            'type': 'bitcoin'
        }
    }
    
    @classmethod
    def get_network_config(cls) -> Dict[str, Any]:
        """Get network-specific configuration"""
        return {
            'ethereum': {
                'network': cls.ETHEREUM_NETWORK,
                'rpc_url': cls.ETHEREUM_RPC_URL,
                'chain_id': cls.CHAIN_ID
            },
            'bitcoin': {
                'network': cls.BITCOIN_NETWORK,
                'api_url': cls.BLOCKCYPHER_BASE_URL
            }
        }
    
    @classmethod
    def get_contract_addresses(cls) -> Dict[str, str]:
        """Get all smart contract addresses"""
        return {
            'drst_coin': cls.DRST_COIN_ADDRESS,
            'vision_coin': cls.VISION_COIN_ADDRESS,
            'health_passport': cls.HEALTH_PASSPORT_ADDRESS,
            'achievement_nft': cls.ACHIEVEMENT_NFT_ADDRESS
        }
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate that all required configuration is present"""
        required_contracts = [
            cls.DRST_COIN_ADDRESS,
            cls.VISION_COIN_ADDRESS,
            cls.HEALTH_PASSPORT_ADDRESS,
            cls.ACHIEVEMENT_NFT_ADDRESS
        ]
        
        missing_contracts = [addr for addr in required_contracts if not addr]
        
        if missing_contracts:
            print("❌ Missing smart contract addresses. Please deploy contracts first.")
            return False
        
        if not cls.ETHEREUM_RPC_URL or 'YOUR_PROJECT_ID' in cls.ETHEREUM_RPC_URL:
            print("❌ Please configure a valid Ethereum RPC URL")
            return False
        
        return True
    
    @classmethod
    def get_achievement_metadata(cls, achievement_type: int) -> Dict[str, Any]:
        """Get metadata for achievement NFT"""
        if achievement_type not in cls.ACHIEVEMENT_TYPES:
            raise ValueError(f"Invalid achievement type: {achievement_type}")
        
        achievement = cls.ACHIEVEMENT_TYPES[achievement_type]
        return {
            'name': achievement['name'],
            'description': achievement['description'],
            'image': f"https://ipfs.io/ipfs/QmAchievements/{achievement['image']}",
            'attributes': [
                {
                    'trait_type': 'Achievement Type',
                    'value': achievement['name']
                },
                {
                    'trait_type': 'Category',
                    'value': 'Health & Wellness'
                },
                {
                    'trait_type': 'Rarity',
                    'value': 'Common' if achievement_type < 3 else 'Rare'
                }
            ]
        }

# Global configuration instance
blockchain_config = BlockchainConfig()

def get_blockchain_config() -> BlockchainConfig:
    """Get the global blockchain configuration instance"""
    return blockchain_config
