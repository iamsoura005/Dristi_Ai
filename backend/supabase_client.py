"""
Supabase Client Configuration for Medical Research Backend
Handles database connections, authentication, and storage operations
"""

import os
import logging
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timezone
import uuid
from supabase import create_client, Client
from postgrest import APIError
from storage3.exceptions import StorageException
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SupabaseConfig:
    """Configuration class for Supabase connection"""
    
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')
        self.service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables")
    
    def get_client(self, use_service_role: bool = False) -> Client:
        """Get Supabase client with appropriate key"""
        key = self.service_role_key if use_service_role and self.service_role_key else self.key
        return create_client(self.url, key)

class MedicalResearchDB:
    """Main class for medical research database operations"""
    
    def __init__(self, use_service_role: bool = False):
        self.config = SupabaseConfig()
        self.client = self.config.get_client(use_service_role)
        self.storage = self.client.storage
        
    # =====================================================
    # PATIENT OPERATIONS
    # =====================================================
    
    def create_patient(self, age: int, gender: str, region: str) -> Dict[str, Any]:
        """Create a new patient record"""
        try:
            patient_data = {
                'age': age,
                'gender': gender,
                'region': region
            }
            
            result = self.client.table('patients').insert(patient_data).execute()
            
            if result.data:
                logger.info(f"Created patient: {result.data[0]['patient_id']}")
                return result.data[0]
            else:
                raise Exception("Failed to create patient")
                
        except APIError as e:
            logger.error(f"Error creating patient: {e}")
            raise
    
    def get_patient(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Get patient by ID"""
        try:
            result = self.client.table('patients').select('*').eq('patient_id', patient_id).execute()
            return result.data[0] if result.data else None
        except APIError as e:
            logger.error(f"Error fetching patient {patient_id}: {e}")
            return None
    
    def list_patients(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List all patients with pagination"""
        try:
            result = self.client.table('patients').select('*').range(offset, offset + limit - 1).execute()
            return result.data
        except APIError as e:
            logger.error(f"Error listing patients: {e}")
            return []
    
    # =====================================================
    # EYE OPERATIONS
    # =====================================================
    
    def create_eye(self, patient_id: str, side: str, axial_length: Optional[float] = None, 
                   notes: Optional[str] = None) -> Dict[str, Any]:
        """Create an eye record for a patient"""
        try:
            eye_data = {
                'patient_id': patient_id,
                'side': side,
                'axial_length': axial_length,
                'notes': notes
            }
            
            result = self.client.table('eyes').insert(eye_data).execute()
            
            if result.data:
                logger.info(f"Created eye: {result.data[0]['eye_id']}")
                return result.data[0]
            else:
                raise Exception("Failed to create eye record")
                
        except APIError as e:
            logger.error(f"Error creating eye: {e}")
            raise
    
    def get_patient_eyes(self, patient_id: str) -> List[Dict[str, Any]]:
        """Get all eyes for a patient"""
        try:
            result = self.client.table('eyes').select('*').eq('patient_id', patient_id).execute()
            return result.data
        except APIError as e:
            logger.error(f"Error fetching eyes for patient {patient_id}: {e}")
            return []
    
    # =====================================================
    # FUNDUS IMAGE OPERATIONS
    # =====================================================
    
    def upload_fundus_image(self, eye_id: str, image_file: bytes, 
                           filename: str, capture_device: Optional[str] = None,
                           resolution: Optional[str] = None) -> Dict[str, Any]:
        """Upload a fundus image to storage and create database record"""
        try:
            # Get eye and patient info for path generation
            eye_result = self.client.table('eyes').select('patient_id').eq('eye_id', eye_id).execute()
            if not eye_result.data:
                raise Exception(f"Eye {eye_id} not found")
            
            patient_id = eye_result.data[0]['patient_id']
            
            # Generate storage path
            timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%S')
            file_extension = filename.split('.')[-1].lower()
            storage_path = f"{patient_id}/{eye_id}/{timestamp}.{file_extension}"
            
            # Upload to storage
            storage_result = self.storage.from_('fundus-images').upload(
                path=storage_path,
                file=image_file,
                file_options={'content-type': f'image/{file_extension}'}
            )
            
            if storage_result.error:
                raise StorageException(f"Storage upload failed: {storage_result.error}")
            
            # Create database record
            image_url = f"fundus-images/{storage_path}"
            image_data = {
                'eye_id': eye_id,
                'image_url': image_url,
                'capture_device': capture_device,
                'resolution': resolution,
                'captured_at': datetime.now(timezone.utc).isoformat()
            }
            
            db_result = self.client.table('fundus_images').insert(image_data).execute()
            
            if db_result.data:
                logger.info(f"Uploaded fundus image: {db_result.data[0]['image_id']}")
                return db_result.data[0]
            else:
                raise Exception("Failed to create image database record")
                
        except (APIError, StorageException) as e:
            logger.error(f"Error uploading fundus image: {e}")
            raise
    
    def get_fundus_image_url(self, image_id: str, expires_in: int = 3600) -> Optional[str]:
        """Get signed URL for fundus image"""
        try:
            # Get image record
            result = self.client.table('fundus_images').select('image_url').eq('image_id', image_id).execute()
            if not result.data:
                return None
            
            image_path = result.data[0]['image_url'].replace('fundus-images/', '')
            
            # Generate signed URL
            signed_url = self.storage.from_('fundus-images').create_signed_url(
                path=image_path,
                expires_in=expires_in
            )
            
            return signed_url['signedURL'] if signed_url else None
            
        except (APIError, StorageException) as e:
            logger.error(f"Error getting signed URL for image {image_id}: {e}")
            return None
    
    def list_eye_images(self, eye_id: str) -> List[Dict[str, Any]]:
        """List all images for an eye"""
        try:
            result = self.client.table('fundus_images').select('*').eq('eye_id', eye_id).execute()
            return result.data
        except APIError as e:
            logger.error(f"Error listing images for eye {eye_id}: {e}")
            return []
    
    # =====================================================
    # REFRACTIVE MEASUREMENT OPERATIONS
    # =====================================================
    
    def create_refractive_measurement(self, eye_id: str, sphere: float, cylinder: float,
                                    axis: float, measurement_method: str,
                                    measured_at: Optional[datetime] = None) -> Dict[str, Any]:
        """Create a refractive measurement record"""
        try:
            if measured_at is None:
                measured_at = datetime.now(timezone.utc)
            
            measurement_data = {
                'eye_id': eye_id,
                'sphere': sphere,
                'cylinder': cylinder,
                'axis': axis,
                'measurement_method': measurement_method,
                'measured_at': measured_at.isoformat()
            }
            
            result = self.client.table('refractive_measurements').insert(measurement_data).execute()
            
            if result.data:
                logger.info(f"Created refractive measurement: {result.data[0]['measurement_id']}")
                return result.data[0]
            else:
                raise Exception("Failed to create refractive measurement")
                
        except APIError as e:
            logger.error(f"Error creating refractive measurement: {e}")
            raise
    
    def get_eye_measurements(self, eye_id: str) -> List[Dict[str, Any]]:
        """Get all refractive measurements for an eye"""
        try:
            result = self.client.table('refractive_measurements').select('*').eq('eye_id', eye_id).execute()
            return result.data
        except APIError as e:
            logger.error(f"Error fetching measurements for eye {eye_id}: {e}")
            return []
    
    # =====================================================
    # ML TRAINING DATASET OPERATIONS
    # =====================================================
    
    def get_ml_training_dataset(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get complete dataset for ML training"""
        try:
            query = self.client.table('ml_training_dataset').select('*')
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return result.data
        except APIError as e:
            logger.error(f"Error fetching ML training dataset: {e}")
            return []
    
    def log_model_training(self, model_name: str, dataset_version: str,
                          mae: float, rmse: float, r2_score: Optional[float] = None,
                          training_samples: Optional[int] = None,
                          validation_samples: Optional[int] = None,
                          test_samples: Optional[int] = None,
                          hyperparameters: Optional[Dict] = None,
                          training_duration_minutes: Optional[int] = None) -> Dict[str, Any]:
        """Log model training results"""
        try:
            log_data = {
                'model_name': model_name,
                'dataset_version': dataset_version,
                'mae': mae,
                'rmse': rmse,
                'r2_score': r2_score,
                'training_samples': training_samples,
                'validation_samples': validation_samples,
                'test_samples': test_samples,
                'hyperparameters': hyperparameters,
                'training_duration_minutes': training_duration_minutes
            }
            
            result = self.client.table('model_training_logs').insert(log_data).execute()
            
            if result.data:
                logger.info(f"Logged model training: {result.data[0]['run_id']}")
                return result.data[0]
            else:
                raise Exception("Failed to log model training")
                
        except APIError as e:
            logger.error(f"Error logging model training: {e}")
            raise
    
    def get_model_performance_history(self, model_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get model training performance history"""
        try:
            query = self.client.table('model_training_logs').select('*').order('trained_at', desc=True)
            if model_name:
                query = query.eq('model_name', model_name)
            
            result = query.execute()
            return result.data
        except APIError as e:
            logger.error(f"Error fetching model performance history: {e}")
            return []
    
    # =====================================================
    # UTILITY METHODS
    # =====================================================
    
    def get_database_stats(self) -> Dict[str, int]:
        """Get database statistics"""
        try:
            stats = {}
            
            # Count records in each table
            tables = ['patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs']
            
            for table in tables:
                result = self.client.table(table).select('*', count='exact').execute()
                stats[table] = result.count
            
            return stats
        except APIError as e:
            logger.error(f"Error getting database stats: {e}")
            return {}
    
    def health_check(self) -> bool:
        """Check if database connection is healthy"""
        try:
            result = self.client.table('patients').select('patient_id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

# Example usage and testing
if __name__ == "__main__":
    # Initialize database connection
    db = MedicalResearchDB()
    
    # Test connection
    if db.health_check():
        print("✅ Database connection successful")
        
        # Get stats
        stats = db.get_database_stats()
        print(f"📊 Database stats: {stats}")
    else:
        print("❌ Database connection failed")
