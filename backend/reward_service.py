"""
VisionCoin Reward System Service
Handles automated token rewards for test completions
"""
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional
from models import db, User, BlockchainTransaction
from blockchain_services.wallet_service import get_wallet_service

class RewardService:
    """Service for managing VisionCoin rewards"""
    
    # Reward amounts in VisionCoins
    REWARDS = {
        'normal_eye_condition': 5.0,
        'poor_eye_condition': 2.0,
        'color_blindness_high_accuracy': 7.0,  # 70%+ accuracy
        'color_blindness_low_accuracy': 3.0,   # <70% accuracy
        'test_completion': 1.0,  # Base reward for any test completion
    }
    
    def __init__(self):
        self.wallet_service = get_wallet_service()
    
    def calculate_eye_analysis_reward(self, analysis_result: Dict) -> float:
        """Calculate reward based on eye analysis result"""
        try:
            # Extract analysis data
            disease_detected = analysis_result.get('disease_detected', 'normal').lower()
            confidence = analysis_result.get('confidence', 0)
            
            # Determine reward based on result
            if disease_detected == 'normal' or 'normal' in disease_detected:
                return self.REWARDS['normal_eye_condition']
            else:
                # Poor eye condition detected
                return self.REWARDS['poor_eye_condition']
                
        except Exception as e:
            print(f"Error calculating eye analysis reward: {e}")
            return self.REWARDS['test_completion']  # Fallback to base reward
    
    def calculate_color_blindness_reward(self, test_result: Dict) -> float:
        """Calculate reward based on color blindness test accuracy"""
        try:
            accuracy = test_result.get('accuracy', 0)
            
            if accuracy >= 70:
                return self.REWARDS['color_blindness_high_accuracy']
            else:
                return self.REWARDS['color_blindness_low_accuracy']
                
        except Exception as e:
            print(f"Error calculating color blindness reward: {e}")
            return self.REWARDS['test_completion']  # Fallback to base reward
    
    def award_visioncoin(self, user_id: int, amount: float, reason: str, test_type: str = None) -> Dict:
        """Award VisionCoins to a user"""
        try:
            # Get user's wallet info
            wallet_info = self.wallet_service.get_wallet_info(user_id)
            if wallet_info.get('status') != 'active':
                return {
                    'success': False,
                    'error': 'User wallet not found or inactive'
                }
            
            eth_address = wallet_info['eth_address']
            
            # Mint VisionCoins (VSC) to user's wallet
            mint_result = self.wallet_service.mint_vision_coin(eth_address, amount)
            
            if not mint_result.get('success'):
                return {
                    'success': False,
                    'error': f"Failed to mint VisionCoins: {mint_result.get('error', 'Unknown error')}"
                }
            
            # Record transaction in database
            transaction = BlockchainTransaction(
                user_id=user_id,
                tx_hash=mint_result.get('tx_hash', ''),
                tx_type='VSC',
                amount=Decimal(str(amount)),
                from_address='0x0000000000000000000000000000000000000000',  # Mint address
                to_address=eth_address,
                status='confirmed',
                network='testnet'
            )
            db.session.add(transaction)
            db.session.commit()
            
            return {
                'success': True,
                'amount': amount,
                'reason': reason,
                'tx_hash': mint_result.get('tx_hash'),
                'new_balance': self.wallet_service.get_token_balance(eth_address, 'VSC')
            }
            
        except Exception as e:
            print(f"Error awarding VisionCoins: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def process_eye_analysis_reward(self, user_id: int, analysis_result: Dict) -> Dict:
        """Process reward for eye analysis completion"""
        reward_amount = self.calculate_eye_analysis_reward(analysis_result)
        disease = analysis_result.get('disease_detected', 'unknown')
        
        reason = f"Eye analysis completed - {disease} detected"
        return self.award_visioncoin(user_id, reward_amount, reason, 'eye_analysis')
    
    def process_color_blindness_reward(self, user_id: int, test_result: Dict) -> Dict:
        """Process reward for color blindness test completion"""
        reward_amount = self.calculate_color_blindness_reward(test_result)
        accuracy = test_result.get('accuracy', 0)
        
        reason = f"Color blindness test completed - {accuracy}% accuracy"
        return self.award_visioncoin(user_id, reward_amount, reason, 'color_blindness')
    
    def get_user_reward_history(self, user_id: int, limit: int = 20) -> list:
        """Get user's reward history"""
        try:
            transactions = BlockchainTransaction.query.filter_by(
                user_id=user_id,
                tx_type='VSC'
            ).order_by(BlockchainTransaction.created_at.desc()).limit(limit).all()
            
            history = []
            for tx in transactions:
                history.append({
                    'id': tx.id,
                    'amount': float(tx.amount),
                    'tx_hash': tx.tx_hash,
                    'status': tx.status,
                    'created_at': tx.created_at.isoformat() if tx.created_at else None
                })
            
            return history
            
        except Exception as e:
            print(f"Error getting reward history: {e}")
            return []

# Global instance
reward_service = RewardService()
