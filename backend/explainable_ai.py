"""
Explainable AI module for generating visual explanations of model predictions.
This module implements Grad-CAM (Gradient-weighted Class Activation Mapping) 
to show which parts of the input image the model focused on for making predictions.
"""

import numpy as np
import tensorflow as tf
from PIL import Image
import cv2
import base64
import io


class GradCAMExplainer:
    """
    Grad-CAM implementation for explaining CNN model predictions on medical images.
    """
    
    def __init__(self, model, layer_name=None):
        """
        Initialize the Grad-CAM explainer.
        
        Args:
            model: Trained Keras/TensorFlow model
            layer_name: Name of the layer to use for Grad-CAM. If None, uses the last convolutional layer.
        """
        self.model = model
        self.layer_name = layer_name
        if self.layer_name is None:
            self.layer_name = self._find_last_conv_layer()
    
    def _find_last_conv_layer(self):
        """Find the last convolutional layer in the model."""
        for layer in reversed(self.model.layers):
            if len(layer.output_shape) == 4:  # Conv layers have 4D output (batch, height, width, channels)
                return layer.name
        raise ValueError("No convolutional layers found in the model")
    
    def generate_heatmap(self, img_array, class_idx, alpha=0.4):
        """
        Generate Grad-CAM heatmap for a given image and class.
        
        Args:
            img_array: Preprocessed image array (1, height, width, channels)
            class_idx: Index of the class to explain
            alpha: Transparency of the heatmap overlay (0-1)
            
        Returns:
            dict: Contains heatmap data, overlay image, and confidence metrics
        """
        try:
            # Create a model that outputs both the predictions and the feature maps
            grad_model = tf.keras.models.Model(
                inputs=self.model.inputs,
                outputs=[self.model.get_layer(self.layer_name).output, self.model.output]
            )
            
            # Calculate gradients
            with tf.GradientTape() as tape:
                conv_outputs, predictions = grad_model(img_array)
                loss = predictions[:, class_idx]
            
            # Calculate gradients of the loss with respect to the feature maps
            grads = tape.gradient(loss, conv_outputs)
            
            # Calculate the mean gradient for each feature map
            pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
            
            # Multiply each feature map by its corresponding gradient weight
            conv_outputs = conv_outputs[0]
            heatmap = tf.reduce_sum(tf.multiply(pooled_grads, conv_outputs), axis=-1)
            
            # Normalize the heatmap
            heatmap = tf.maximum(heatmap, 0) / tf.math.reduce_max(heatmap)
            heatmap = heatmap.numpy()
            
            # Resize heatmap to match input image size
            input_size = img_array.shape[1:3]  # (height, width)
            heatmap_resized = cv2.resize(heatmap, (input_size[1], input_size[0]))
            
            # Convert to 0-255 range
            heatmap_uint8 = np.uint8(255 * heatmap_resized)
            
            # Create colormap
            heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
            heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
            
            # Create overlay with original image
            original_img = np.uint8(255 * img_array[0])
            overlay = cv2.addWeighted(original_img, 1-alpha, heatmap_colored, alpha, 0)
            
            # Convert images to base64 for web transmission
            heatmap_b64 = self._array_to_base64(heatmap_colored)
            overlay_b64 = self._array_to_base64(overlay)
            
            # Calculate attention metrics
            attention_stats = self._calculate_attention_stats(heatmap_resized)
            
            return {
                'heatmap_base64': heatmap_b64,
                'overlay_base64': overlay_b64,
                'attention_stats': attention_stats,
                'layer_used': self.layer_name,
                'success': True
            }
            
        except Exception as e:
            print(f"❌ Error generating Grad-CAM heatmap: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def _array_to_base64(self, img_array):
        """Convert numpy array to base64 string for web transmission."""
        img_pil = Image.fromarray(img_array)
        buffer = io.BytesIO()
        img_pil.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"
    
    def _calculate_attention_stats(self, heatmap):
        """Calculate statistics about where the model is paying attention."""
        # Find regions of high attention (top 20% of values)
        threshold = np.percentile(heatmap, 80)
        high_attention_mask = heatmap >= threshold
        
        # Calculate center of attention
        y_coords, x_coords = np.where(high_attention_mask)
        if len(y_coords) > 0:
            center_y = np.mean(y_coords) / heatmap.shape[0]  # Normalize to 0-1
            center_x = np.mean(x_coords) / heatmap.shape[1]  # Normalize to 0-1
        else:
            center_y, center_x = 0.5, 0.5
        
        # Calculate attention concentration (how focused vs. distributed)
        concentration = np.std(heatmap)
        
        # Find dominant quadrants
        h, w = heatmap.shape
        quadrants = {
            'top_left': np.mean(heatmap[:h//2, :w//2]),
            'top_right': np.mean(heatmap[:h//2, w//2:]),
            'bottom_left': np.mean(heatmap[h//2:, :w//2]),
            'bottom_right': np.mean(heatmap[h//2:, w//2:])
        }
        
        dominant_quadrant = max(quadrants.keys(), key=lambda k: quadrants[k])
        
        return {
            'center_of_attention': {'x': float(center_x), 'y': float(center_y)},
            'attention_concentration': float(concentration),
            'dominant_quadrant': dominant_quadrant,
            'quadrant_scores': {k: float(v) for k, v in quadrants.items()},
            'max_attention_value': float(np.max(heatmap)),
            'coverage_percentage': float(np.sum(high_attention_mask) / heatmap.size * 100)
        }


def generate_multi_class_explanation(model, img_array, class_names, top_k=3):
    """
    Generate explanations for multiple classes to show different reasoning patterns.
    
    Args:
        model: Trained model
        img_array: Preprocessed image
        class_names: List of class names
        top_k: Number of top predictions to explain
        
    Returns:
        dict: Explanations for multiple classes
    """
    try:
        # Get predictions
        predictions = model.predict(img_array, verbose=0)[0]
        
        # Get top-k predictions
        top_indices = np.argsort(predictions)[-top_k:][::-1]
        
        explainer = GradCAMExplainer(model)
        explanations = {}
        
        for i, class_idx in enumerate(top_indices):
            class_name = class_names[class_idx]
            confidence = float(predictions[class_idx])
            
            if confidence > 0.01:  # Only explain if confidence is significant
                explanation = explainer.generate_heatmap(img_array, class_idx)
                explanations[class_name] = {
                    'class_index': int(class_idx),
                    'confidence': confidence,
                    'rank': i + 1,
                    'explanation': explanation
                }
        
        return {
            'multi_class_explanations': explanations,
            'total_classes_explained': len(explanations),
            'success': True
        }
        
    except Exception as e:
        print(f"❌ Error generating multi-class explanations: {str(e)}")
        return {
            'error': str(e),
            'success': False
        }


def generate_medical_interpretation(attention_stats, predicted_class, confidence):
    """
    Generate medical interpretation of the attention patterns.
    
    Args:
        attention_stats: Statistics about attention patterns
        predicted_class: Predicted disease class
        confidence: Model confidence
        
    Returns:
        dict: Medical interpretation and insights
    """
    interpretation = {
        'focus_description': '',
        'clinical_relevance': '',
        'confidence_explanation': '',
        'recommendations': []
    }
    
    # Analyze attention patterns
    center = attention_stats['center_of_attention']
    concentration = attention_stats['attention_concentration']
    dominant_quad = attention_stats['dominant_quadrant']
    coverage = attention_stats['coverage_percentage']
    
    # Focus description based on location
    if center['x'] < 0.3 and center['y'] < 0.3:
        focus_area = "upper-left region"
    elif center['x'] > 0.7 and center['y'] < 0.3:
        focus_area = "upper-right region"
    elif center['x'] < 0.3 and center['y'] > 0.7:
        focus_area = "lower-left region"
    elif center['x'] > 0.7 and center['y'] > 0.7:
        focus_area = "lower-right region"
    elif abs(center['x'] - 0.5) < 0.2 and abs(center['y'] - 0.5) < 0.2:
        focus_area = "central region (likely optic disc area)"
    else:
        focus_area = "peripheral region"
    
    interpretation['focus_description'] = f"The AI model focused primarily on the {focus_area} of the fundus image."
    
    # Clinical relevance based on predicted class and attention pattern
    if predicted_class == 'diabetic_retinopathy':
        if 'central' in focus_area:
            interpretation['clinical_relevance'] = "Central focus suggests attention to macular changes, which are important in diabetic retinopathy diagnosis."
        else:
            interpretation['clinical_relevance'] = "Peripheral focus may indicate detection of microaneurysms or hemorrhages typical of diabetic retinopathy."
    
    elif predicted_class == 'glaucoma':
        if 'central' in focus_area:
            interpretation['clinical_relevance'] = "Central attention likely indicates analysis of the optic disc and cup-to-disc ratio, key indicators for glaucoma."
        else:
            interpretation['clinical_relevance'] = "The attention pattern suggests analysis of retinal nerve fiber layer changes associated with glaucoma."
    
    elif predicted_class == 'cataract':
        interpretation['clinical_relevance'] = "The attention pattern indicates detection of lens opacity or reflection artifacts that may suggest cataract presence."
    
    else:  # normal
        interpretation['clinical_relevance'] = "The attention pattern shows the AI examined typical anatomical structures without finding significant pathological indicators."
    
    # Confidence explanation
    if confidence > 0.8:
        interpretation['confidence_explanation'] = f"High confidence ({confidence:.1%}) indicates strong pathological indicators were detected."
    elif confidence > 0.6:
        interpretation['confidence_explanation'] = f"Moderate confidence ({confidence:.1%}) suggests some pathological indicators were found, but they may be subtle."
    else:
        interpretation['confidence_explanation'] = f"Lower confidence ({confidence:.1%}) indicates uncertain findings that require professional evaluation."
    
    # Recommendations based on findings
    if concentration > 0.3:
        interpretation['recommendations'].append("Focused attention pattern suggests specific pathological features - consider targeted examination of the highlighted areas.")
    
    if coverage < 20:
        interpretation['recommendations'].append("Limited attention coverage may indicate localized pathology or image quality issues.")
    elif coverage > 60:
        interpretation['recommendations'].append("Widespread attention pattern may indicate diffuse pathological changes or image artifacts.")
    
    if confidence < 0.6:
        interpretation['recommendations'].append("Lower confidence suggests the need for professional ophthalmological evaluation.")
    
    interpretation['recommendations'].append("This AI analysis is for screening purposes only and should not replace professional medical diagnosis.")
    
    return interpretation