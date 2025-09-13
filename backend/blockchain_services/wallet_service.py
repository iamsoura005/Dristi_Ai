"""
Wallet Service for Dristi AI Blockchain Integration
Handles secure wallet creation, private key management, and crypto transactions
"""

import os
import json
import hashlib
import secrets
from typing import Dict, Any, Optional, Tuple, List
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
from eth_account import Account
from models import db, User, Wallet, BlockchainTransaction
from .security_service import get_security_service
import requests
from datetime import datetime

class WalletService:
    """Service for managing crypto wallets and transactions"""
    
    def __init__(self):
        """Initialize wallet service"""
        self.security_service = get_security_service()
        self.encryption_key = self._get_or_create_encryption_key()
        self.fernet = Fernet(self.encryption_key)

        # BlockCypher API configuration
        self.blockcypher_token = os.getenv('BLOCKCYPHER_TOKEN', '')
        self.blockcypher_base_url = "https://api.blockcypher.com/v1/btc/test3"
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for private key storage"""
        key_file = os.path.join(os.path.dirname(__file__), '.wallet_key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def _derive_key_from_password(self, password: str, salt: bytes) -> bytes:
        """Derive encryption key from password"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def create_wallet(self, user_id: int, password: str) -> Dict[str, str]:
        """
        Create new crypto wallet for user
        
        Args:
            user_id: User ID
            password: User password for encryption
            
        Returns:
            Wallet information
        """
        try:
            # Generate Ethereum wallet
            eth_account = Account.create()
            eth_address = eth_account.address
            eth_private_key = eth_account.key.hex()
            
            # Generate Bitcoin wallet (simplified - using random private key)
            btc_private_key = secrets.token_hex(32)
            # For production, use proper Bitcoin key derivation
            btc_address = self._generate_btc_address(btc_private_key)
            
            # Encrypt private keys
            salt = os.urandom(16)
            encryption_key = self._derive_key_from_password(password, salt)
            fernet = Fernet(encryption_key)
            
            encrypted_eth_key = fernet.encrypt(eth_private_key.encode()).decode()
            encrypted_btc_key = fernet.encrypt(btc_private_key.encode()).decode()
            
            # Store wallet data
            wallet_data = {
                'user_id': user_id,
                'eth_address': eth_address,
                'btc_address': btc_address,
                'encrypted_eth_key': encrypted_eth_key,
                'encrypted_btc_key': encrypted_btc_key,
                'salt': base64.b64encode(salt).decode(),
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Save to database (you'll need to create a Wallet model)
            self._save_wallet_to_db(wallet_data)
            
            return {
                'eth_address': eth_address,
                'btc_address': btc_address,
                'status': 'created'
            }
            
        except Exception as e:
            raise Exception(f"Failed to create wallet: {str(e)}")
    
    def _generate_btc_address(self, private_key: str) -> str:
        """
        Generate Bitcoin address from private key (simplified)
        In production, use proper Bitcoin libraries like bitcoinlib
        """
        # This is a simplified implementation
        # For production, use proper Bitcoin address generation
        hash_obj = hashlib.sha256(private_key.encode())
        return f"tb1{hash_obj.hexdigest()[:30]}"  # Testnet address format
    
    def _save_wallet_to_db(self, wallet_data: Dict[str, Any]):
        """Save wallet data to database"""
        try:
            wallet = Wallet(
                user_id=wallet_data['user_id'],
                eth_address=wallet_data['eth_address'],
                encrypted_eth_private_key=wallet_data['encrypted_eth_key'],
                btc_address=wallet_data['btc_address'],
                encrypted_btc_private_key=wallet_data['encrypted_btc_key'],
                salt=wallet_data['salt'],
                encryption_method='password'
            )

            db.session.add(wallet)
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to save wallet to database: {str(e)}")
    
    def get_wallet_info(self, user_id: int) -> Dict[str, Any]:
        """
        Get wallet information for user
        
        Args:
            user_id: User ID
            
        Returns:
            Wallet information
        """
        try:
            # Retrieve from database
            wallet_data = self._get_wallet_from_db(user_id)
            
            if not wallet_data:
                return {'status': 'no_wallet'}
            
            return {
                'eth_address': wallet_data['eth_address'],
                'btc_address': wallet_data['btc_address'],
                'created_at': wallet_data['created_at'],
                'status': 'active'
            }
            
        except Exception as e:
            raise Exception(f"Failed to get wallet info: {str(e)}")
    
    def _get_wallet_from_db(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get wallet data from database"""
        try:
            wallet = Wallet.query.filter_by(user_id=user_id).first()
            if wallet:
                return {
                    'user_id': wallet.user_id,
                    'eth_address': wallet.eth_address,
                    'encrypted_eth_key': wallet.encrypted_eth_private_key,
                    'btc_address': wallet.btc_address,
                    'encrypted_btc_key': wallet.encrypted_btc_private_key,
                    'salt': wallet.salt,
                    'encryption_method': wallet.encryption_method
                }
            return None
        except Exception as e:
            print(f"Error retrieving wallet from database: {str(e)}")
            return None
    
    def get_eth_balance(self, address: str) -> float:
        """
        Get Ethereum balance
        
        Args:
            address: Ethereum address
            
        Returns:
            ETH balance
        """
        try:
            from .web3_service import get_web3_service
            web3_service = get_web3_service()
            return web3_service.get_balance(address)
        except Exception as e:
            raise Exception(f"Failed to get ETH balance: {str(e)}")
    
    def get_token_balance(self, address: str, token_type: str) -> float:
        """
        Get token balance (DRST or VSC)
        
        Args:
            address: Ethereum address
            token_type: Token type (DRST or VSC)
            
        Returns:
            Token balance
        """
        try:
            from .web3_service import get_web3_service
            web3_service = get_web3_service()
            
            contract_name = 'DRSTCoin' if token_type == 'DRST' else 'VisionCoin'
            return web3_service.get_token_balance(contract_name, address)
            
        except Exception as e:
            raise Exception(f"Failed to get token balance: {str(e)}")
    
    def get_btc_balance(self, address: str) -> float:
        """
        Get Bitcoin balance using BlockCypher API
        
        Args:
            address: Bitcoin address
            
        Returns:
            BTC balance
        """
        try:
            url = f"{self.blockcypher_base_url}/addrs/{address}/balance"
            if self.blockcypher_token:
                url += f"?token={self.blockcypher_token}"
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            balance_satoshi = data.get('balance', 0)
            return balance_satoshi / 100000000  # Convert to BTC
            
        except Exception as e:
            raise Exception(f"Failed to get BTC balance: {str(e)}")
    
    def send_eth(self, user_id: int, password: str, to_address: str, 
                 amount: float) -> str:
        """
        Send Ethereum transaction
        
        Args:
            user_id: User ID
            password: User password for decryption
            to_address: Recipient address
            amount: Amount in ETH
            
        Returns:
            Transaction hash
        """
        try:
            # Get encrypted private key
            wallet_data = self._get_wallet_from_db(user_id)
            if not wallet_data:
                raise Exception("Wallet not found")
            
            # Decrypt private key
            salt = base64.b64decode(wallet_data['salt'])
            encryption_key = self._derive_key_from_password(password, salt)
            fernet = Fernet(encryption_key)
            
            private_key = fernet.decrypt(wallet_data['encrypted_eth_key'].encode()).decode()
            
            # Send transaction
            from .web3_service import Web3Service
            web3_service = Web3Service(private_key=private_key)
            return web3_service.send_transaction(to_address, amount)
            
        except Exception as e:
            raise Exception(f"Failed to send ETH: {str(e)}")
    
    def send_tokens(self, user_id: int, password: str, to_address: str, 
                   amount: float, token_type: str) -> str:
        """
        Send token transaction
        
        Args:
            user_id: User ID
            password: User password for decryption
            to_address: Recipient address
            amount: Amount of tokens
            token_type: Token type (DRST or VSC)
            
        Returns:
            Transaction hash
        """
        try:
            # Get encrypted private key
            wallet_data = self._get_wallet_from_db(user_id)
            if not wallet_data:
                raise Exception("Wallet not found")
            
            # Decrypt private key
            salt = base64.b64decode(wallet_data['salt'])
            encryption_key = self._derive_key_from_password(password, salt)
            fernet = Fernet(encryption_key)
            
            private_key = fernet.decrypt(wallet_data['encrypted_eth_key'].encode()).decode()
            
            # Send token transaction
            from .web3_service import Web3Service
            web3_service = Web3Service(private_key=private_key)
            contract_name = 'DRSTCoin' if token_type == 'DRST' else 'VisionCoin'
            return web3_service.send_token(contract_name, to_address, amount)
            
        except Exception as e:
            raise Exception(f"Failed to send tokens: {str(e)}")
    
    def send_btc(self, user_id: int, password: str, to_address: str, 
                 amount: float) -> str:
        """
        Send Bitcoin transaction using BlockCypher API
        
        Args:
            user_id: User ID
            password: User password for decryption
            to_address: Recipient address
            amount: Amount in BTC
            
        Returns:
            Transaction hash
        """
        try:
            # Get encrypted private key
            wallet_data = self._get_wallet_from_db(user_id)
            if not wallet_data:
                raise Exception("Wallet not found")
            
            # Decrypt private key
            salt = base64.b64decode(wallet_data['salt'])
            encryption_key = self._derive_key_from_password(password, salt)
            fernet = Fernet(encryption_key)
            
            private_key = fernet.decrypt(wallet_data['encrypted_btc_key'].encode()).decode()
            
            # Create and send BTC transaction via BlockCypher
            # This is a simplified implementation
            # In production, use proper Bitcoin transaction creation
            
            amount_satoshi = int(amount * 100000000)
            
            # Create transaction
            tx_data = {
                "inputs": [{"addresses": [wallet_data['btc_address']]}],
                "outputs": [{"addresses": [to_address], "value": amount_satoshi}]
            }
            
            url = f"{self.blockcypher_base_url}/txs/new"
            if self.blockcypher_token:
                url += f"?token={self.blockcypher_token}"
            
            response = requests.post(url, json=tx_data, timeout=10)
            response.raise_for_status()
            
            # Sign and send (simplified - in production, use proper signing)
            tx_response = response.json()
            return tx_response.get('tx', {}).get('hash', 'pending')
            
        except Exception as e:
            raise Exception(f"Failed to send BTC: {str(e)}")
    
    def get_transaction_history(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get transaction history for user
        
        Args:
            user_id: User ID
            
        Returns:
            List of transactions
        """
        try:
            wallet_data = self._get_wallet_from_db(user_id)
            if not wallet_data:
                return []
            
            # Get ETH transactions (simplified)
            eth_txs = self._get_eth_transactions(wallet_data['eth_address'])
            
            # Get BTC transactions
            btc_txs = self._get_btc_transactions(wallet_data['btc_address'])
            
            # Combine and sort by timestamp
            all_txs = eth_txs + btc_txs
            all_txs.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return all_txs
            
        except Exception as e:
            raise Exception(f"Failed to get transaction history: {str(e)}")
    
    def _get_eth_transactions(self, address: str) -> List[Dict[str, Any]]:
        """Get Ethereum transactions for address"""
        # This would use Etherscan API or similar
        # For now, return empty list
        return []
    
    def _get_btc_transactions(self, address: str) -> List[Dict[str, Any]]:
        """Get Bitcoin transactions for address"""
        try:
            url = f"{self.blockcypher_base_url}/addrs/{address}/full"
            if self.blockcypher_token:
                url += f"?token={self.blockcypher_token}"
            
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            txs = data.get('txs', [])
            
            formatted_txs = []
            for tx in txs[:10]:  # Limit to 10 recent transactions
                formatted_txs.append({
                    'hash': tx['hash'],
                    'type': 'BTC',
                    'amount': tx.get('total', 0) / 100000000,
                    'timestamp': tx.get('confirmed', ''),
                    'confirmations': tx.get('confirmations', 0)
                })
            
            return formatted_txs
            
        except Exception as e:
            print(f"Failed to get BTC transactions: {str(e)}")
            return []

# Global wallet service instance
wallet_service = WalletService()

def get_wallet_service() -> WalletService:
    """Get the global wallet service instance"""
    return wallet_service
