"""
Fundus Image ML Training Pipeline for Refractive Power Prediction
Comprehensive ML pipeline using Supabase backend for medical research
"""

import os
import sys
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import cv2
from PIL import Image
import requests
from io import BytesIO
from typing import Dict, List, Tuple, Optional, Any
import json
import logging
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import seaborn as sns

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from supabase_client import MedicalResearchDB
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Please install required packages and ensure supabase_client.py is available")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FundusImagePreprocessor:
    """Preprocessor for fundus images with medical-specific augmentations"""
    
    def __init__(self, target_size: Tuple[int, int] = (224, 224)):
        self.target_size = target_size
        
    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess a single fundus image"""
        try:
            # Load image from bytes
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Resize image
            img_resized = cv2.resize(img_array, self.target_size)
            
            # Normalize pixel values to [0, 1]
            img_normalized = img_resized.astype(np.float32) / 255.0
            
            # Apply medical-specific preprocessing
            img_processed = self._apply_medical_preprocessing(img_normalized)
            
            return img_processed
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            return None
    
    def _apply_medical_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """Apply medical-specific preprocessing to fundus images"""
        # Convert to LAB color space for better contrast
        lab_image = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab_image[:, :, 0] = clahe.apply((lab_image[:, :, 0] * 255).astype(np.uint8)) / 255.0
        
        # Convert back to RGB
        enhanced_image = cv2.cvtColor(lab_image, cv2.COLOR_LAB2RGB)
        
        # Apply Gaussian blur to reduce noise
        blurred_image = cv2.GaussianBlur(enhanced_image, (3, 3), 0)
        
        return blurred_image
    
    def create_data_augmentation(self) -> keras.Sequential:
        """Create data augmentation pipeline for training"""
        return keras.Sequential([
            layers.RandomFlip("horizontal"),
            layers.RandomRotation(0.1),
            layers.RandomZoom(0.1),
            layers.RandomContrast(0.1),
            layers.RandomBrightness(0.1),
        ])

class RefractiveErrorPredictor:
    """ML model for predicting refractive error from fundus images"""
    
    def __init__(self, input_shape: Tuple[int, int, int] = (224, 224, 3)):
        self.input_shape = input_shape
        self.model = None
        self.history = None
        self.scaler = StandardScaler()
        
    def build_model(self, model_type: str = "efficientnet") -> keras.Model:
        """Build the ML model architecture"""
        if model_type == "efficientnet":
            return self._build_efficientnet_model()
        elif model_type == "resnet":
            return self._build_resnet_model()
        elif model_type == "custom_cnn":
            return self._build_custom_cnn_model()
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    def _build_efficientnet_model(self) -> keras.Model:
        """Build EfficientNet-based model"""
        base_model = keras.applications.EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=self.input_shape
        )
        
        # Freeze base model initially
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.3),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(1, activation='linear')  # Regression output
        ])
        
        return model
    
    def _build_resnet_model(self) -> keras.Model:
        """Build ResNet-based model"""
        base_model = keras.applications.ResNet50(
            weights='imagenet',
            include_top=False,
            input_shape=self.input_shape
        )
        
        base_model.trainable = False
        
        model = keras.Sequential([
            base_model,
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.4),
            layers.Dense(256, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(128, activation='relu'),
            layers.Dense(1, activation='linear')
        ])
        
        return model
    
    def _build_custom_cnn_model(self) -> keras.Model:
        """Build custom CNN model"""
        model = keras.Sequential([
            layers.Conv2D(32, (3, 3), activation='relu', input_shape=self.input_shape),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(128, (3, 3), activation='relu'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(256, (3, 3), activation='relu'),
            layers.GlobalAveragePooling2D(),
            layers.Dropout(0.5),
            layers.Dense(512, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(256, activation='relu'),
            layers.Dense(1, activation='linear')
        ])
        
        return model
    
    def compile_model(self, model: keras.Model, learning_rate: float = 0.001) -> keras.Model:
        """Compile the model with appropriate loss and metrics"""
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
            loss='mse',
            metrics=['mae', 'mse']
        )
        return model
    
    def train_model(self, X_train: np.ndarray, y_train: np.ndarray,
                   X_val: np.ndarray, y_val: np.ndarray,
                   epochs: int = 100, batch_size: int = 32,
                   use_augmentation: bool = True) -> Dict[str, Any]:
        """Train the model and return training history"""
        
        # Create data augmentation if requested
        if use_augmentation:
            preprocessor = FundusImagePreprocessor()
            augmentation = preprocessor.create_data_augmentation()
            
            # Apply augmentation to training data
            train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train))
            train_dataset = train_dataset.batch(batch_size)
            train_dataset = train_dataset.map(
                lambda x, y: (augmentation(x, training=True), y),
                num_parallel_calls=tf.data.AUTOTUNE
            )
            train_dataset = train_dataset.prefetch(tf.data.AUTOTUNE)
        else:
            train_dataset = tf.data.Dataset.from_tensor_slices((X_train, y_train)).batch(batch_size)
        
        val_dataset = tf.data.Dataset.from_tensor_slices((X_val, y_val)).batch(batch_size)
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=15,
                restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=8,
                min_lr=1e-7
            ),
            keras.callbacks.ModelCheckpoint(
                'best_model.h5',
                monitor='val_loss',
                save_best_only=True
            )
        ]
        
        # Train model
        start_time = datetime.now()
        self.history = self.model.fit(
            train_dataset,
            epochs=epochs,
            validation_data=val_dataset,
            callbacks=callbacks,
            verbose=1
        )
        end_time = datetime.now()
        
        training_duration = (end_time - start_time).total_seconds() / 60  # minutes
        
        return {
            'training_duration_minutes': training_duration,
            'final_train_loss': self.history.history['loss'][-1],
            'final_val_loss': self.history.history['val_loss'][-1],
            'best_val_loss': min(self.history.history['val_loss'])
        }
    
    def evaluate_model(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, float]:
        """Evaluate model performance on test set"""
        # Make predictions
        y_pred = self.model.predict(X_test)
        y_pred = y_pred.flatten()
        
        # Calculate metrics
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        return {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2_score': float(r2)
        }
    
    def plot_training_history(self, save_path: str = None):
        """Plot training history"""
        if not self.history:
            logger.warning("No training history available")
            return
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
        
        # Plot loss
        ax1.plot(self.history.history['loss'], label='Training Loss')
        ax1.plot(self.history.history['val_loss'], label='Validation Loss')
        ax1.set_title('Model Loss')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.legend()
        
        # Plot MAE
        ax2.plot(self.history.history['mae'], label='Training MAE')
        ax2.plot(self.history.history['val_mae'], label='Validation MAE')
        ax2.set_title('Model MAE')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('MAE')
        ax2.legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            logger.info(f"Training history plot saved to {save_path}")
        
        plt.show()

class MLTrainingPipeline:
    """Complete ML training pipeline for refractive error prediction"""
    
    def __init__(self, db: MedicalResearchDB):
        self.db = db
        self.preprocessor = FundusImagePreprocessor()
        self.predictor = RefractiveErrorPredictor()
        
    def load_dataset(self, limit: Optional[int] = None) -> Tuple[np.ndarray, np.ndarray, pd.DataFrame]:
        """Load and preprocess dataset from Supabase"""
        logger.info("Loading dataset from Supabase...")
        
        # Get dataset from database
        dataset = self.db.get_ml_training_dataset(limit=limit)
        
        if not dataset:
            raise ValueError("No data available in ml_training_dataset")
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(dataset)
        
        logger.info(f"Loaded {len(df)} records from database")
        
        # Load and preprocess images
        images = []
        targets = []
        valid_indices = []
        
        for idx, row in df.iterrows():
            try:
                # Get signed URL for image
                image_path = row['image_url'].replace('fundus-images/', '')
                signed_url = self.db.storage.from_('fundus-images').create_signed_url(
                    path=image_path,
                    expires_in=3600
                )
                
                if not signed_url:
                    logger.warning(f"Could not get signed URL for image {row['image_id']}")
                    continue
                
                # Download image
                response = requests.get(signed_url['signedURL'])
                if response.status_code != 200:
                    logger.warning(f"Could not download image {row['image_id']}")
                    continue
                
                # Preprocess image
                processed_image = self.preprocessor.preprocess_image(response.content)
                if processed_image is None:
                    logger.warning(f"Could not preprocess image {row['image_id']}")
                    continue
                
                images.append(processed_image)
                targets.append(row['spherical_equivalent'])
                valid_indices.append(idx)
                
            except Exception as e:
                logger.warning(f"Error processing image {row['image_id']}: {e}")
                continue
        
        if not images:
            raise ValueError("No valid images could be processed")
        
        # Convert to numpy arrays
        X = np.array(images)
        y = np.array(targets)
        
        # Filter DataFrame to only valid records
        df_valid = df.iloc[valid_indices].reset_index(drop=True)
        
        logger.info(f"Successfully processed {len(X)} images")
        
        return X, y, df_valid
    
    def split_dataset(self, X: np.ndarray, y: np.ndarray, df: pd.DataFrame,
                     test_size: float = 0.2, val_size: float = 0.1,
                     random_state: int = 42) -> Tuple:
        """Split dataset into train, validation, and test sets"""
        
        # First split: separate test set
        X_temp, X_test, y_temp, y_test, df_temp, df_test = train_test_split(
            X, y, df, test_size=test_size, random_state=random_state, stratify=None
        )
        
        # Second split: separate train and validation from remaining data
        val_size_adjusted = val_size / (1 - test_size)
        X_train, X_val, y_train, y_val, df_train, df_val = train_test_split(
            X_temp, y_temp, df_temp, test_size=val_size_adjusted, random_state=random_state
        )
        
        logger.info(f"Dataset split - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test, df_train, df_val, df_test
    
    def train_and_evaluate(self, model_name: str = "EfficientNet-B0",
                          model_type: str = "efficientnet",
                          epochs: int = 100,
                          batch_size: int = 32,
                          learning_rate: float = 0.001,
                          dataset_limit: Optional[int] = None) -> Dict[str, Any]:
        """Complete training and evaluation pipeline"""
        
        logger.info(f"Starting training pipeline for {model_name}")
        
        # Load dataset
        X, y, df = self.load_dataset(limit=dataset_limit)
        
        # Split dataset
        X_train, X_val, X_test, y_train, y_val, y_test, df_train, df_val, df_test = self.split_dataset(X, y, df)
        
        # Build and compile model
        self.predictor.model = self.predictor.build_model(model_type)
        self.predictor.model = self.predictor.compile_model(self.predictor.model, learning_rate)
        
        logger.info(f"Model architecture: {model_name}")
        self.predictor.model.summary()
        
        # Train model
        training_info = self.predictor.train_model(
            X_train, y_train, X_val, y_val,
            epochs=epochs, batch_size=batch_size
        )
        
        # Evaluate model
        test_metrics = self.predictor.evaluate_model(X_test, y_test)
        
        # Log results to database
        dataset_version = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        training_log = self.db.log_model_training(
            model_name=model_name,
            dataset_version=dataset_version,
            mae=test_metrics['mae'],
            rmse=test_metrics['rmse'],
            r2_score=test_metrics['r2_score'],
            training_samples=len(X_train),
            validation_samples=len(X_val),
            test_samples=len(X_test),
            hyperparameters={
                'model_type': model_type,
                'epochs': epochs,
                'batch_size': batch_size,
                'learning_rate': learning_rate,
                'input_shape': list(self.predictor.input_shape)
            },
            training_duration_minutes=int(training_info['training_duration_minutes'])
        )
        
        logger.info(f"Training completed and logged with run_id: {training_log['run_id']}")
        
        # Plot training history
        self.predictor.plot_training_history(f"{model_name}_training_history.png")
        
        return {
            'run_id': training_log['run_id'],
            'model_name': model_name,
            'dataset_version': dataset_version,
            'training_info': training_info,
            'test_metrics': test_metrics,
            'dataset_sizes': {
                'train': len(X_train),
                'val': len(X_val),
                'test': len(X_test)
            }
        }

def main():
    """Main training function"""
    # Initialize database connection
    db = MedicalResearchDB()
    
    if not db.health_check():
        logger.error("Database connection failed")
        return
    
    # Initialize training pipeline
    pipeline = MLTrainingPipeline(db)
    
    # Train multiple models for comparison
    models_to_train = [
        {
            'model_name': 'EfficientNet-B0',
            'model_type': 'efficientnet',
            'learning_rate': 0.001,
            'batch_size': 16
        },
        {
            'model_name': 'ResNet50',
            'model_type': 'resnet',
            'learning_rate': 0.001,
            'batch_size': 16
        },
        {
            'model_name': 'Custom-CNN',
            'model_type': 'custom_cnn',
            'learning_rate': 0.001,
            'batch_size': 32
        }
    ]
    
    results = []
    
    for model_config in models_to_train:
        try:
            logger.info(f"Training {model_config['model_name']}...")
            
            result = pipeline.train_and_evaluate(
                model_name=model_config['model_name'],
                model_type=model_config['model_type'],
                epochs=50,  # Reduced for demo
                batch_size=model_config['batch_size'],
                learning_rate=model_config['learning_rate'],
                dataset_limit=None  # Use full dataset
            )
            
            results.append(result)
            
            logger.info(f"✅ {model_config['model_name']} training completed")
            logger.info(f"   MAE: {result['test_metrics']['mae']:.3f}")
            logger.info(f"   RMSE: {result['test_metrics']['rmse']:.3f}")
            logger.info(f"   R²: {result['test_metrics']['r2_score']:.3f}")
            
        except Exception as e:
            logger.error(f"❌ Error training {model_config['model_name']}: {e}")
            continue
    
    # Print summary
    if results:
        logger.info("\n🎉 Training Summary:")
        for result in results:
            logger.info(f"  {result['model_name']}: MAE={result['test_metrics']['mae']:.3f}, "
                       f"RMSE={result['test_metrics']['rmse']:.3f}, R²={result['test_metrics']['r2_score']:.3f}")

if __name__ == "__main__":
    main()
