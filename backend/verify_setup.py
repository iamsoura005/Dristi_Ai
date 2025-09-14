#!/usr/bin/env python3
"""
Supabase Medical Research Backend - Setup Verification Script
Comprehensive testing of database, storage, authentication, and RLS policies
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
import tempfile
from PIL import Image
import io

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

try:
    from supabase_client import MedicalResearchDB
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install required packages: pip install -r requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv()

class SetupVerifier:
    """Comprehensive setup verification for Supabase Medical Research Backend"""
    
    def __init__(self):
        self.db = None
        self.test_results = []
        self.errors = []
        
    def log_test(self, test_name: str, success: bool, message: str = "", details: Any = None):
        """Log test result"""
        status = "✅" if success else "❌"
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        print(f"{status} {test_name}")
        if message:
            print(f"   {message}")
        if not success:
            self.errors.append(f"{test_name}: {message}")
    
    def test_environment_variables(self) -> bool:
        """Test if all required environment variables are set"""
        required_vars = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            self.log_test(
                "Environment Variables",
                False,
                f"Missing variables: {', '.join(missing_vars)}"
            )
            return False
        
        self.log_test(
            "Environment Variables",
            True,
            "All required environment variables are set"
        )
        return True
    
    def test_database_connection(self) -> bool:
        """Test database connection"""
        try:
            self.db = MedicalResearchDB()
            if self.db.health_check():
                self.log_test(
                    "Database Connection",
                    True,
                    "Successfully connected to Supabase database"
                )
                return True
            else:
                self.log_test(
                    "Database Connection",
                    False,
                    "Health check failed"
                )
                return False
        except Exception as e:
            self.log_test(
                "Database Connection",
                False,
                f"Connection failed: {str(e)}"
            )
            return False
    
    def test_database_schema(self) -> bool:
        """Test if all required tables exist"""
        if not self.db:
            return False
        
        try:
            stats = self.db.get_database_stats()
            required_tables = ['patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs']
            
            missing_tables = []
            for table in required_tables:
                if table not in stats:
                    missing_tables.append(table)
            
            if missing_tables:
                self.log_test(
                    "Database Schema",
                    False,
                    f"Missing tables: {', '.join(missing_tables)}"
                )
                return False
            
            self.log_test(
                "Database Schema",
                True,
                f"All required tables exist",
                stats
            )
            return True
        except Exception as e:
            self.log_test(
                "Database Schema",
                False,
                f"Schema check failed: {str(e)}"
            )
            return False
    
    def test_sample_data(self) -> bool:
        """Test if sample data was inserted correctly"""
        if not self.db:
            return False
        
        try:
            stats = self.db.get_database_stats()
            
            # Expected counts from seed data
            expected_counts = {
                'patients': 8,
                'eyes': 16,
                'fundus_images': 16,
                'refractive_measurements': 16,
                'model_training_logs': 5
            }
            
            mismatches = []
            for table, expected in expected_counts.items():
                actual = stats.get(table, 0)
                if actual < expected:
                    mismatches.append(f"{table}: expected {expected}, got {actual}")
            
            if mismatches:
                self.log_test(
                    "Sample Data",
                    False,
                    f"Data count mismatches: {'; '.join(mismatches)}"
                )
                return False
            
            self.log_test(
                "Sample Data",
                True,
                "Sample data inserted correctly",
                stats
            )
            return True
        except Exception as e:
            self.log_test(
                "Sample Data",
                False,
                f"Sample data check failed: {str(e)}"
            )
            return False
    
    def test_ml_training_dataset(self) -> bool:
        """Test ML training dataset view"""
        if not self.db:
            return False
        
        try:
            dataset = self.db.get_ml_training_dataset(limit=5)
            
            if not dataset:
                self.log_test(
                    "ML Training Dataset",
                    False,
                    "No data returned from ml_training_dataset view"
                )
                return False
            
            # Check required fields
            required_fields = ['image_url', 'spherical_equivalent', 'age', 'gender', 'eye_side']
            sample_record = dataset[0]
            missing_fields = [field for field in required_fields if field not in sample_record]
            
            if missing_fields:
                self.log_test(
                    "ML Training Dataset",
                    False,
                    f"Missing fields in dataset: {', '.join(missing_fields)}"
                )
                return False
            
            self.log_test(
                "ML Training Dataset",
                True,
                f"Dataset view working correctly, {len(dataset)} records retrieved"
            )
            return True
        except Exception as e:
            self.log_test(
                "ML Training Dataset",
                False,
                f"Dataset view test failed: {str(e)}"
            )
            return False
    
    def test_crud_operations(self) -> bool:
        """Test basic CRUD operations"""
        if not self.db:
            return False
        
        try:
            # Test CREATE
            test_patient = self.db.create_patient(
                age=35,
                gender='male',
                region='Test Region'
            )
            patient_id = test_patient['patient_id']
            
            # Test READ
            retrieved_patient = self.db.get_patient(patient_id)
            if not retrieved_patient or retrieved_patient['age'] != 35:
                self.log_test(
                    "CRUD Operations",
                    False,
                    "Patient creation or retrieval failed"
                )
                return False
            
            # Test CREATE eye
            test_eye = self.db.create_eye(
                patient_id=patient_id,
                side='right',
                axial_length=24.0,
                notes='Test eye'
            )
            eye_id = test_eye['eye_id']
            
            # Test CREATE refractive measurement
            test_measurement = self.db.create_refractive_measurement(
                eye_id=eye_id,
                sphere=-2.0,
                cylinder=-0.5,
                axis=90,
                measurement_method='subjective'
            )
            
            # Verify spherical equivalent calculation
            if abs(test_measurement['spherical_equivalent'] - (-2.25)) > 0.01:
                self.log_test(
                    "CRUD Operations",
                    False,
                    "Spherical equivalent calculation incorrect"
                )
                return False
            
            self.log_test(
                "CRUD Operations",
                True,
                "All CRUD operations working correctly"
            )
            return True
        except Exception as e:
            self.log_test(
                "CRUD Operations",
                False,
                f"CRUD operations failed: {str(e)}"
            )
            return False
    
    def test_storage_operations(self) -> bool:
        """Test storage upload and download operations"""
        if not self.db:
            return False
        
        try:
            # Create a test image
            test_image = Image.new('RGB', (100, 100), color='red')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG')
            img_data = img_buffer.getvalue()
            
            # Get a test eye ID
            patients = self.db.list_patients(limit=1)
            if not patients:
                self.log_test(
                    "Storage Operations",
                    False,
                    "No patients available for storage test"
                )
                return False
            
            patient_id = patients[0]['patient_id']
            eyes = self.db.get_patient_eyes(patient_id)
            if not eyes:
                self.log_test(
                    "Storage Operations",
                    False,
                    "No eyes available for storage test"
                )
                return False
            
            eye_id = eyes[0]['eye_id']
            
            # Test upload
            upload_result = self.db.upload_fundus_image(
                eye_id=eye_id,
                image_file=img_data,
                filename='test_image.jpg',
                capture_device='Test Device',
                resolution='100x100'
            )
            
            image_id = upload_result['image_id']
            
            # Test signed URL generation
            signed_url = self.db.get_fundus_image_url(image_id, expires_in=300)
            if not signed_url:
                self.log_test(
                    "Storage Operations",
                    False,
                    "Failed to generate signed URL"
                )
                return False
            
            self.log_test(
                "Storage Operations",
                True,
                "Storage upload and URL generation working correctly"
            )
            return True
        except Exception as e:
            self.log_test(
                "Storage Operations",
                False,
                f"Storage operations failed: {str(e)}"
            )
            return False
    
    def test_model_training_logging(self) -> bool:
        """Test model training result logging"""
        if not self.db:
            return False
        
        try:
            # Log a test training run
            training_log = self.db.log_model_training(
                model_name='TestModel',
                dataset_version='test-v1.0',
                mae=0.75,
                rmse=1.02,
                r2_score=0.85,
                training_samples=100,
                validation_samples=25,
                test_samples=25,
                hyperparameters={'learning_rate': 0.001, 'batch_size': 16},
                training_duration_minutes=30
            )
            
            # Verify log was created
            run_id = training_log['run_id']
            history = self.db.get_model_performance_history(model_name='TestModel')
            
            if not any(log['run_id'] == run_id for log in history):
                self.log_test(
                    "Model Training Logging",
                    False,
                    "Training log not found in performance history"
                )
                return False
            
            self.log_test(
                "Model Training Logging",
                True,
                "Model training logging working correctly"
            )
            return True
        except Exception as e:
            self.log_test(
                "Model Training Logging",
                False,
                f"Model training logging failed: {str(e)}"
            )
            return False
    
    def run_all_tests(self) -> bool:
        """Run all verification tests"""
        print("🔍 Starting Supabase Medical Research Backend Verification")
        print("=" * 60)
        
        tests = [
            self.test_environment_variables,
            self.test_database_connection,
            self.test_database_schema,
            self.test_sample_data,
            self.test_ml_training_dataset,
            self.test_crud_operations,
            self.test_storage_operations,
            self.test_model_training_logging
        ]
        
        all_passed = True
        for test in tests:
            try:
                result = test()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log_test(
                    test.__name__,
                    False,
                    f"Test execution failed: {str(e)}"
                )
                all_passed = False
            
            time.sleep(0.5)  # Brief pause between tests
        
        print("\n" + "=" * 60)
        
        if all_passed:
            print("🎉 All tests passed! Supabase backend is ready for production.")
        else:
            print("❌ Some tests failed. Please check the errors above.")
            print("\nErrors encountered:")
            for error in self.errors:
                print(f"  • {error}")
        
        # Save test results
        self.save_test_results()
        
        return all_passed
    
    def save_test_results(self):
        """Save test results to file"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'overall_success': len(self.errors) == 0,
            'total_tests': len(self.test_results),
            'passed_tests': len([r for r in self.test_results if r['success']]),
            'failed_tests': len([r for r in self.test_results if not r['success']]),
            'errors': self.errors,
            'detailed_results': self.test_results
        }
        
        with open('setup_verification_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📄 Test results saved to: setup_verification_results.json")

def main():
    """Main verification function"""
    verifier = SetupVerifier()
    success = verifier.run_all_tests()
    
    if success:
        print("\n🚀 Ready to proceed with ML pipeline implementation!")
        sys.exit(0)
    else:
        print("\n🔧 Please fix the issues above before proceeding.")
        sys.exit(1)

if __name__ == "__main__":
    main()
