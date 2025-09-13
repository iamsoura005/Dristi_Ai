"""
Web3 Service for Dristi AI Blockchain Integration
Handles smart contract interactions and Ethereum transactions
"""

import json
import os
from typing import Dict, Any, List, Optional, Tuple
from web3 import Web3
# Skip middleware for now - not needed for local development
from eth_account import Account
from cryptography.fernet import Fernet
import hashlib
from datetime import datetime

class Web3Service:
    """Service for interacting with Ethereum blockchain and smart contracts"""
    
    def __init__(self, provider_url: str = None, private_key: str = None):
        """
        Initialize Web3 service
        
        Args:
            provider_url: Ethereum node URL
            private_key: Private key for transactions
        """
        # Default to local Hardhat node or Infura
        self.provider_url = provider_url or os.getenv('ETHEREUM_RPC_URL', 'http://127.0.0.1:8545')
        self.w3 = Web3(Web3.HTTPProvider(self.provider_url))
        
        # Skip PoA middleware for local development
        # if 'goerli' in self.provider_url or 'sepolia' in self.provider_url:
        #     self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Set default account if private key provided
        if private_key:
            self.account = Account.from_key(private_key)
            self.w3.eth.default_account = self.account.address
        else:
            self.account = None
        
        # Contract addresses (will be loaded from deployment)
        self.contract_addresses = {}
        self.contracts = {}
        
        # Load contract ABIs and addresses
        self._load_contracts()
    
    def _load_contracts(self):
        """Load contract ABIs and addresses from deployment files"""
        try:
            # Load contract addresses from deployment file
            deployment_file = os.path.join(os.path.dirname(__file__), 
                                         '../../blockchain/deployments/goerli.json')
            if os.path.exists(deployment_file):
                with open(deployment_file, 'r') as f:
                    deployment_data = json.load(f)
                    self.contract_addresses = {
                        name: data['address'] 
                        for name, data in deployment_data['contracts'].items()
                    }
            
            # Load contract ABIs
            abi_dir = os.path.join(os.path.dirname(__file__), '../../blockchain/abis')
            contract_names = ['DigitalHealthPassport', 'DRSTCoin', 'VisionCoin', 'AchievementNFT']
            
            for contract_name in contract_names:
                abi_file = os.path.join(abi_dir, f'{contract_name}.json')
                if os.path.exists(abi_file):
                    with open(abi_file, 'r') as f:
                        abi = json.load(f)
                        
                    if contract_name in self.contract_addresses:
                        self.contracts[contract_name] = self.w3.eth.contract(
                            address=self.contract_addresses[contract_name],
                            abi=abi
                        )
                        
        except Exception as e:
            print(f"Warning: Could not load contracts: {str(e)}")
    
    def is_connected(self) -> bool:
        """Check if connected to Ethereum network"""
        try:
            return self.w3.is_connected()
        except:
            return False
    
    def get_balance(self, address: str) -> float:
        """
        Get ETH balance for address
        
        Args:
            address: Ethereum address
            
        Returns:
            Balance in ETH
        """
        try:
            balance_wei = self.w3.eth.get_balance(address)
            return self.w3.from_wei(balance_wei, 'ether')
        except Exception as e:
            raise Exception(f"Failed to get balance: {str(e)}")
    
    def get_token_balance(self, token_contract_name: str, address: str) -> float:
        """
        Get token balance for address
        
        Args:
            token_contract_name: Name of token contract (DRSTCoin or VisionCoin)
            address: Ethereum address
            
        Returns:
            Token balance
        """
        try:
            if token_contract_name not in self.contracts:
                raise Exception(f"Contract {token_contract_name} not loaded")
            
            contract = self.contracts[token_contract_name]
            balance_wei = contract.functions.balanceOf(address).call()
            return self.w3.from_wei(balance_wei, 'ether')
            
        except Exception as e:
            raise Exception(f"Failed to get token balance: {str(e)}")
    
    def create_wallet(self) -> Tuple[str, str]:
        """
        Create new Ethereum wallet
        
        Returns:
            Tuple of (address, private_key)
        """
        try:
            account = Account.create()
            return account.address, account.key.hex()
        except Exception as e:
            raise Exception(f"Failed to create wallet: {str(e)}")
    
    def send_transaction(self, to_address: str, value_eth: float, 
                        gas_limit: int = 21000) -> str:
        """
        Send ETH transaction
        
        Args:
            to_address: Recipient address
            value_eth: Amount in ETH
            gas_limit: Gas limit
            
        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")
        
        try:
            # Get nonce
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            
            # Build transaction
            transaction = {
                'to': to_address,
                'value': self.w3.to_wei(value_eth, 'ether'),
                'gas': gas_limit,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            }
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise Exception(f"Failed to send transaction: {str(e)}")
    
    def send_token(self, token_contract_name: str, to_address: str, 
                   amount: float) -> str:
        """
        Send token transaction
        
        Args:
            token_contract_name: Name of token contract
            to_address: Recipient address
            amount: Amount of tokens
            
        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")
        
        try:
            if token_contract_name not in self.contracts:
                raise Exception(f"Contract {token_contract_name} not loaded")
            
            contract = self.contracts[token_contract_name]
            amount_wei = self.w3.to_wei(amount, 'ether')
            
            # Build transaction
            transaction = contract.functions.transfer(
                to_address, amount_wei
            ).build_transaction({
                'from': self.account.address,
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise Exception(f"Failed to send token: {str(e)}")
    
    def add_health_record(self, patient_address: str, ipfs_hash: str, 
                         record_type: str) -> str:
        """
        Add health record to blockchain
        
        Args:
            patient_address: Patient's Ethereum address
            ipfs_hash: IPFS hash of health record
            record_type: Type of health record
            
        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")
        
        try:
            contract = self.contracts['DigitalHealthPassport']
            
            # Build transaction
            transaction = contract.functions.addHealthRecord(
                patient_address, ipfs_hash, record_type
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise Exception(f"Failed to add health record: {str(e)}")
    
    def get_health_records(self, patient_address: str) -> List[Dict[str, Any]]:
        """
        Get health records for patient
        
        Args:
            patient_address: Patient's Ethereum address
            
        Returns:
            List of health records
        """
        try:
            contract = self.contracts['DigitalHealthPassport']
            
            # Get record IDs
            record_ids = contract.functions.getPatientRecordIds(patient_address).call()
            
            # Get record details
            records = []
            for record_id in record_ids:
                record = contract.functions.getHealthRecord(record_id).call()
                records.append({
                    'recordId': record[0],
                    'patientAddress': record[1],
                    'ipfsHash': record[2],
                    'timestamp': record[3],
                    'recordType': record[4],
                    'isActive': record[5]
                })
            
            return records
            
        except Exception as e:
            raise Exception(f"Failed to get health records: {str(e)}")
    
    def mint_drst_tokens(self, user_address: str, activity_type: str) -> str:
        """
        Mint DRST tokens for user activity
        
        Args:
            user_address: User's Ethereum address
            activity_type: Type of activity (eye_test, daily_exercise, family_member)
            
        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")
        
        try:
            contract = self.contracts['DRSTCoin']
            
            # Choose appropriate function based on activity type
            if activity_type == 'eye_test':
                function = contract.functions.rewardEyeTest(user_address)
            elif activity_type == 'daily_exercise':
                function = contract.functions.rewardDailyExercise(user_address)
            elif activity_type == 'family_member':
                function = contract.functions.rewardFamilyMember(user_address)
            else:
                raise Exception(f"Unknown activity type: {activity_type}")
            
            # Build transaction
            transaction = function.build_transaction({
                'from': self.account.address,
                'gas': 150000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()
            
        except Exception as e:
            raise Exception(f"Failed to mint DRST tokens: {str(e)}")
    
    def mint_vision_coins(self, user_address: str, health_condition: int, 
                         ipfs_hash: str) -> str:
        """
        Mint VisionCoins based on health analysis
        
        Args:
            user_address: User's Ethereum address
            health_condition: Health condition (0=Normal, 1=Mild, 2=Severe)
            ipfs_hash: IPFS hash of analysis data
            
        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")
        
        try:
            contract = self.contracts['VisionCoin']
            
            # Build transaction
            transaction = contract.functions.processHealthAnalysis(
                user_address, health_condition, ipfs_hash
            ).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return tx_hash.hex()

        except Exception as e:
            raise Exception(f"Failed to mint VisionCoins: {str(e)}")

    def mint_achievement_nft(self, user_address: str, achievement_type: int,
                           image_uri: str) -> str:
        """
        Mint achievement NFT for user

        Args:
            user_address: User's Ethereum address
            achievement_type: Type of achievement (0=FirstEyeTest, 1=VisionImproved, 2=FamilyComplete)
            image_uri: IPFS URI of NFT image

        Returns:
            Transaction hash
        """
        if not self.account:
            raise Exception("No account configured for transactions")

        try:
            contract = self.contracts['AchievementNFT']

            # Build transaction
            transaction = contract.functions.mintAchievement(
                user_address, achievement_type, image_uri, ""
            ).build_transaction({
                'from': self.account.address,
                'gas': 250000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })

            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)

            return tx_hash.hex()

        except Exception as e:
            raise Exception(f"Failed to mint achievement NFT: {str(e)}")

    def get_user_nfts(self, user_address: str) -> List[Dict[str, Any]]:
        """
        Get user's achievement NFTs

        Args:
            user_address: User's Ethereum address

        Returns:
            List of NFT details
        """
        try:
            contract = self.contracts['AchievementNFT']

            # Get user's token IDs
            token_ids = contract.functions.getUserAchievements(user_address).call()

            # Get NFT details
            nfts = []
            for token_id in token_ids:
                achievement = contract.functions.getAchievement(token_id).call()
                nfts.append({
                    'tokenId': token_id,
                    'achievementType': achievement[0],
                    'name': achievement[1],
                    'description': achievement[2],
                    'imageURI': achievement[3],
                    'mintedAt': achievement[4],
                    'recipient': achievement[5]
                })

            return nfts

        except Exception as e:
            raise Exception(f"Failed to get user NFTs: {str(e)}")

# Global Web3 service instance
web3_service = Web3Service()

def get_web3_service() -> Web3Service:
    """Get the global Web3 service instance"""
    return web3_service
