"""
Demographic Analysis for Refractive Error ML Models
Validates model performance across different demographic groups
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Any
import logging
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from scipy import stats

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from supabase_client import MedicalResearchDB
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DemographicAnalyzer:
    """Analyze model performance across demographic groups"""
    
    def __init__(self, db: MedicalResearchDB):
        self.db = db
        
    def load_dataset_with_predictions(self, model_predictions: Dict[str, float] = None) -> pd.DataFrame:
        """Load dataset and optionally merge with model predictions"""
        logger.info("Loading dataset for demographic analysis...")
        
        # Get dataset from database
        dataset = self.db.get_ml_training_dataset()
        
        if not dataset:
            raise ValueError("No data available in ml_training_dataset")
        
        # Convert to DataFrame
        df = pd.DataFrame(dataset)
        
        # Add age groups
        df['age_group'] = pd.cut(
            df['age'], 
            bins=[0, 20, 40, 60, 100], 
            labels=['Under 20', '20-40', '41-60', 'Over 60']
        )
        
        # Add refractive error categories
        df['refractive_category'] = df['spherical_equivalent'].apply(self._categorize_refractive_error)
        
        # Add myopia severity
        df['myopia_severity'] = df['spherical_equivalent'].apply(self._categorize_myopia_severity)
        
        # Merge predictions if provided
        if model_predictions:
            pred_df = pd.DataFrame(list(model_predictions.items()), 
                                 columns=['image_id', 'predicted_se'])
            df = df.merge(pred_df, on='image_id', how='left')
        
        logger.info(f"Loaded {len(df)} records for analysis")
        
        return df
    
    def _categorize_refractive_error(self, spherical_equivalent: float) -> str:
        """Categorize refractive error based on spherical equivalent"""
        if spherical_equivalent < -0.5:
            return 'Myopia'
        elif spherical_equivalent > 0.5:
            return 'Hyperopia'
        else:
            return 'Emmetropia'
    
    def _categorize_myopia_severity(self, spherical_equivalent: float) -> str:
        """Categorize myopia severity"""
        if spherical_equivalent >= -0.5:
            return 'No Myopia'
        elif spherical_equivalent >= -3.0:
            return 'Low Myopia'
        elif spherical_equivalent >= -6.0:
            return 'Moderate Myopia'
        else:
            return 'High Myopia'
    
    def analyze_data_distribution(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze the distribution of data across demographic groups"""
        logger.info("Analyzing data distribution...")
        
        analysis = {
            'total_samples': len(df),
            'demographic_distribution': {},
            'refractive_error_distribution': {},
            'summary_statistics': {}
        }
        
        # Gender distribution
        gender_dist = df['gender'].value_counts()
        analysis['demographic_distribution']['gender'] = gender_dist.to_dict()
        
        # Age group distribution
        age_group_dist = df['age_group'].value_counts()
        analysis['demographic_distribution']['age_group'] = age_group_dist.to_dict()
        
        # Region distribution
        region_dist = df['region'].value_counts()
        analysis['demographic_distribution']['region'] = region_dist.to_dict()
        
        # Refractive error distribution
        refractive_dist = df['refractive_category'].value_counts()
        analysis['refractive_error_distribution']['category'] = refractive_dist.to_dict()
        
        # Myopia severity distribution
        myopia_dist = df['myopia_severity'].value_counts()
        analysis['refractive_error_distribution']['myopia_severity'] = myopia_dist.to_dict()
        
        # Summary statistics
        analysis['summary_statistics'] = {
            'spherical_equivalent': {
                'mean': float(df['spherical_equivalent'].mean()),
                'std': float(df['spherical_equivalent'].std()),
                'min': float(df['spherical_equivalent'].min()),
                'max': float(df['spherical_equivalent'].max()),
                'median': float(df['spherical_equivalent'].median())
            },
            'age': {
                'mean': float(df['age'].mean()),
                'std': float(df['age'].std()),
                'min': int(df['age'].min()),
                'max': int(df['age'].max())
            }
        }
        
        return analysis
    
    def analyze_model_performance_by_demographics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze model performance across demographic groups"""
        if 'predicted_se' not in df.columns:
            raise ValueError("Model predictions not available in dataset")
        
        logger.info("Analyzing model performance by demographics...")
        
        # Remove rows with missing predictions
        df_clean = df.dropna(subset=['predicted_se'])
        
        performance_analysis = {
            'overall_performance': self._calculate_metrics(
                df_clean['spherical_equivalent'], 
                df_clean['predicted_se']
            ),
            'performance_by_group': {}
        }
        
        # Analyze by gender
        performance_analysis['performance_by_group']['gender'] = {}
        for gender in df_clean['gender'].unique():
            gender_data = df_clean[df_clean['gender'] == gender]
            if len(gender_data) > 0:
                performance_analysis['performance_by_group']['gender'][gender] = self._calculate_metrics(
                    gender_data['spherical_equivalent'],
                    gender_data['predicted_se']
                )
        
        # Analyze by age group
        performance_analysis['performance_by_group']['age_group'] = {}
        for age_group in df_clean['age_group'].unique():
            if pd.isna(age_group):
                continue
            age_data = df_clean[df_clean['age_group'] == age_group]
            if len(age_data) > 0:
                performance_analysis['performance_by_group']['age_group'][age_group] = self._calculate_metrics(
                    age_data['spherical_equivalent'],
                    age_data['predicted_se']
                )
        
        # Analyze by region
        performance_analysis['performance_by_group']['region'] = {}
        for region in df_clean['region'].unique():
            region_data = df_clean[df_clean['region'] == region]
            if len(region_data) > 0:
                performance_analysis['performance_by_group']['region'][region] = self._calculate_metrics(
                    region_data['spherical_equivalent'],
                    region_data['predicted_se']
                )
        
        # Analyze by refractive error category
        performance_analysis['performance_by_group']['refractive_category'] = {}
        for category in df_clean['refractive_category'].unique():
            cat_data = df_clean[df_clean['refractive_category'] == category]
            if len(cat_data) > 0:
                performance_analysis['performance_by_group']['refractive_category'][category] = self._calculate_metrics(
                    cat_data['spherical_equivalent'],
                    cat_data['predicted_se']
                )
        
        # Analyze by myopia severity
        performance_analysis['performance_by_group']['myopia_severity'] = {}
        for severity in df_clean['myopia_severity'].unique():
            sev_data = df_clean[df_clean['myopia_severity'] == severity]
            if len(sev_data) > 0:
                performance_analysis['performance_by_group']['myopia_severity'][severity] = self._calculate_metrics(
                    sev_data['spherical_equivalent'],
                    sev_data['predicted_se']
                )
        
        return performance_analysis
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate performance metrics"""
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)
        
        # Calculate correlation
        correlation, p_value = stats.pearsonr(y_true, y_pred)
        
        return {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2_score': float(r2),
            'correlation': float(correlation),
            'p_value': float(p_value),
            'sample_size': len(y_true)
        }
    
    def detect_bias(self, performance_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Detect potential bias in model performance across groups"""
        logger.info("Detecting potential bias...")
        
        bias_analysis = {
            'bias_detected': False,
            'bias_details': {},
            'recommendations': []
        }
        
        overall_mae = performance_analysis['overall_performance']['mae']
        
        # Check for bias across different groups
        for group_type, groups in performance_analysis['performance_by_group'].items():
            group_maes = [metrics['mae'] for metrics in groups.values()]
            
            if len(group_maes) > 1:
                mae_std = np.std(group_maes)
                mae_range = max(group_maes) - min(group_maes)
                
                # Flag potential bias if MAE varies significantly
                if mae_range > overall_mae * 0.3:  # 30% threshold
                    bias_analysis['bias_detected'] = True
                    bias_analysis['bias_details'][group_type] = {
                        'mae_range': float(mae_range),
                        'mae_std': float(mae_std),
                        'group_performance': groups
                    }
                    
                    # Find worst performing group
                    worst_group = max(groups.keys(), key=lambda x: groups[x]['mae'])
                    best_group = min(groups.keys(), key=lambda x: groups[x]['mae'])
                    
                    bias_analysis['recommendations'].append(
                        f"Model shows bias in {group_type}: {worst_group} (MAE: {groups[worst_group]['mae']:.3f}) "
                        f"vs {best_group} (MAE: {groups[best_group]['mae']:.3f}). "
                        f"Consider collecting more data for {worst_group} or using bias mitigation techniques."
                    )
        
        return bias_analysis
    
    def create_visualization_plots(self, df: pd.DataFrame, save_dir: str = "plots") -> List[str]:
        """Create visualization plots for demographic analysis"""
        logger.info("Creating visualization plots...")
        
        os.makedirs(save_dir, exist_ok=True)
        plot_files = []
        
        # Set style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        # 1. Data distribution plots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Gender distribution
        df['gender'].value_counts().plot(kind='bar', ax=axes[0, 0])
        axes[0, 0].set_title('Distribution by Gender')
        axes[0, 0].set_ylabel('Count')
        
        # Age group distribution
        df['age_group'].value_counts().plot(kind='bar', ax=axes[0, 1])
        axes[0, 1].set_title('Distribution by Age Group')
        axes[0, 1].set_ylabel('Count')
        
        # Region distribution
        df['region'].value_counts().plot(kind='bar', ax=axes[1, 0])
        axes[1, 0].set_title('Distribution by Region')
        axes[1, 0].set_ylabel('Count')
        
        # Refractive error distribution
        df['refractive_category'].value_counts().plot(kind='bar', ax=axes[1, 1])
        axes[1, 1].set_title('Distribution by Refractive Error')
        axes[1, 1].set_ylabel('Count')
        
        plt.tight_layout()
        plot_file = os.path.join(save_dir, 'demographic_distribution.png')
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plot_files.append(plot_file)
        plt.close()
        
        # 2. Spherical equivalent distribution
        plt.figure(figsize=(12, 8))
        
        plt.subplot(2, 2, 1)
        plt.hist(df['spherical_equivalent'], bins=30, alpha=0.7)
        plt.title('Overall Spherical Equivalent Distribution')
        plt.xlabel('Spherical Equivalent (D)')
        plt.ylabel('Frequency')
        
        plt.subplot(2, 2, 2)
        for gender in df['gender'].unique():
            gender_data = df[df['gender'] == gender]['spherical_equivalent']
            plt.hist(gender_data, alpha=0.6, label=gender, bins=20)
        plt.title('SE Distribution by Gender')
        plt.xlabel('Spherical Equivalent (D)')
        plt.legend()
        
        plt.subplot(2, 2, 3)
        for age_group in df['age_group'].unique():
            if pd.isna(age_group):
                continue
            age_data = df[df['age_group'] == age_group]['spherical_equivalent']
            plt.hist(age_data, alpha=0.6, label=age_group, bins=15)
        plt.title('SE Distribution by Age Group')
        plt.xlabel('Spherical Equivalent (D)')
        plt.legend()
        
        plt.subplot(2, 2, 4)
        sns.boxplot(data=df, x='refractive_category', y='spherical_equivalent')
        plt.title('SE Distribution by Refractive Category')
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        plot_file = os.path.join(save_dir, 'spherical_equivalent_analysis.png')
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plot_files.append(plot_file)
        plt.close()
        
        # 3. Model performance plots (if predictions available)
        if 'predicted_se' in df.columns:
            df_clean = df.dropna(subset=['predicted_se'])
            
            plt.figure(figsize=(15, 10))
            
            # Scatter plot of predictions vs actual
            plt.subplot(2, 3, 1)
            plt.scatter(df_clean['spherical_equivalent'], df_clean['predicted_se'], alpha=0.6)
            plt.plot([-10, 5], [-10, 5], 'r--', label='Perfect Prediction')
            plt.xlabel('Actual SE (D)')
            plt.ylabel('Predicted SE (D)')
            plt.title('Predictions vs Actual')
            plt.legend()
            
            # Residuals plot
            plt.subplot(2, 3, 2)
            residuals = df_clean['predicted_se'] - df_clean['spherical_equivalent']
            plt.scatter(df_clean['spherical_equivalent'], residuals, alpha=0.6)
            plt.axhline(y=0, color='r', linestyle='--')
            plt.xlabel('Actual SE (D)')
            plt.ylabel('Residuals (D)')
            plt.title('Residuals Plot')
            
            # Performance by gender
            plt.subplot(2, 3, 3)
            gender_mae = []
            gender_labels = []
            for gender in df_clean['gender'].unique():
                gender_data = df_clean[df_clean['gender'] == gender]
                mae = mean_absolute_error(gender_data['spherical_equivalent'], gender_data['predicted_se'])
                gender_mae.append(mae)
                gender_labels.append(gender)
            plt.bar(gender_labels, gender_mae)
            plt.title('MAE by Gender')
            plt.ylabel('MAE (D)')
            
            # Performance by age group
            plt.subplot(2, 3, 4)
            age_mae = []
            age_labels = []
            for age_group in df_clean['age_group'].unique():
                if pd.isna(age_group):
                    continue
                age_data = df_clean[df_clean['age_group'] == age_group]
                mae = mean_absolute_error(age_data['spherical_equivalent'], age_data['predicted_se'])
                age_mae.append(mae)
                age_labels.append(age_group)
            plt.bar(age_labels, age_mae)
            plt.title('MAE by Age Group')
            plt.ylabel('MAE (D)')
            plt.xticks(rotation=45)
            
            # Performance by refractive category
            plt.subplot(2, 3, 5)
            cat_mae = []
            cat_labels = []
            for category in df_clean['refractive_category'].unique():
                cat_data = df_clean[df_clean['refractive_category'] == category]
                mae = mean_absolute_error(cat_data['spherical_equivalent'], cat_data['predicted_se'])
                cat_mae.append(mae)
                cat_labels.append(category)
            plt.bar(cat_labels, cat_mae)
            plt.title('MAE by Refractive Category')
            plt.ylabel('MAE (D)')
            plt.xticks(rotation=45)
            
            # Error distribution
            plt.subplot(2, 3, 6)
            plt.hist(residuals, bins=30, alpha=0.7)
            plt.title('Error Distribution')
            plt.xlabel('Prediction Error (D)')
            plt.ylabel('Frequency')
            
            plt.tight_layout()
            plot_file = os.path.join(save_dir, 'model_performance_analysis.png')
            plt.savefig(plot_file, dpi=300, bbox_inches='tight')
            plot_files.append(plot_file)
            plt.close()
        
        logger.info(f"Created {len(plot_files)} visualization plots in {save_dir}")
        
        return plot_files
    
    def generate_report(self, df: pd.DataFrame, model_predictions: Dict[str, float] = None) -> Dict[str, Any]:
        """Generate comprehensive demographic analysis report"""
        logger.info("Generating comprehensive demographic analysis report...")
        
        # Load data with predictions if provided
        if model_predictions:
            pred_df = pd.DataFrame(list(model_predictions.items()), 
                                 columns=['image_id', 'predicted_se'])
            df = df.merge(pred_df, on='image_id', how='left')
        
        report = {
            'analysis_timestamp': pd.Timestamp.now().isoformat(),
            'data_distribution': self.analyze_data_distribution(df),
            'visualization_plots': self.create_visualization_plots(df)
        }
        
        # Add model performance analysis if predictions available
        if 'predicted_se' in df.columns:
            performance_analysis = self.analyze_model_performance_by_demographics(df)
            bias_analysis = self.detect_bias(performance_analysis)
            
            report['model_performance'] = performance_analysis
            report['bias_analysis'] = bias_analysis
        
        return report

def main():
    """Main analysis function"""
    # Initialize database connection
    db = MedicalResearchDB()
    
    if not db.health_check():
        logger.error("Database connection failed")
        return
    
    # Initialize analyzer
    analyzer = DemographicAnalyzer(db)
    
    # Load dataset
    df = analyzer.load_dataset_with_predictions()
    
    # Generate report
    report = analyzer.generate_report(df)
    
    # Print summary
    logger.info("📊 Demographic Analysis Summary:")
    logger.info(f"  Total samples: {report['data_distribution']['total_samples']}")
    logger.info(f"  Gender distribution: {report['data_distribution']['demographic_distribution']['gender']}")
    logger.info(f"  Age group distribution: {report['data_distribution']['demographic_distribution']['age_group']}")
    logger.info(f"  Refractive error distribution: {report['data_distribution']['refractive_error_distribution']['category']}")
    
    # Save report
    import json
    with open('demographic_analysis_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    logger.info("📄 Report saved to: demographic_analysis_report.json")

if __name__ == "__main__":
    main()
