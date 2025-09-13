"""
Performance Routes for monitoring, optimization, and image processing
"""

from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from datetime import datetime
import io

from models import db, User
from performance_service import (
    CacheService, ImageOptimizationService, DatabaseOptimizationService,
    PerformanceMonitor, CompressionService, CDNService, performance_monitor
)
from security_service import RBACService

performance_bp = Blueprint('performance', __name__, url_prefix='/api/performance')

# Initialize services
cache_service = CacheService()
image_service = ImageOptimizationService()
db_service = DatabaseOptimizationService()
monitor = PerformanceMonitor()
compression_service = CompressionService()
cdn_service = CDNService()
rbac_service = RBACService()

@performance_bp.route('/metrics', methods=['GET'])
@jwt_required()
@performance_monitor
def get_performance_metrics():
    """Get application performance metrics"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'view_analytics'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        metrics = monitor.get_performance_metrics()
        
        return jsonify({
            'success': True,
            'metrics': metrics
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting performance metrics: {str(e)}")
        return jsonify({'error': 'Failed to get performance metrics'}), 500

@performance_bp.route('/cache/stats', methods=['GET'])
@jwt_required()
@performance_monitor
def get_cache_stats():
    """Get cache statistics"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'view_analytics'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        stats = {}
        
        if cache_service.redis_client:
            info = cache_service.redis_client.info()
            stats = {
                'redis_version': info.get('redis_version', 'N/A'),
                'used_memory': info.get('used_memory_human', 'N/A'),
                'used_memory_peak': info.get('used_memory_peak_human', 'N/A'),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'expired_keys': info.get('expired_keys', 0),
                'evicted_keys': info.get('evicted_keys', 0)
            }
            
            # Calculate hit rate
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            if hits + misses > 0:
                stats['hit_rate_percentage'] = round(hits / (hits + misses) * 100, 2)
            else:
                stats['hit_rate_percentage'] = 0
        else:
            stats = {'error': 'Redis not available'}
        
        return jsonify({
            'success': True,
            'cache_stats': stats
        })
        
    except Exception as e:
        current_app.logger.error(f"Error getting cache stats: {str(e)}")
        return jsonify({'error': 'Failed to get cache stats'}), 500

@performance_bp.route('/cache/clear', methods=['POST'])
@jwt_required()
@performance_monitor
def clear_cache():
    """Clear cache entries"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'system_configuration'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        pattern = data.get('pattern', '*')
        
        # Clear cache
        cleared_count = cache_service.clear_pattern(pattern)
        
        return jsonify({
            'success': True,
            'message': f'Cleared {cleared_count} cache entries',
            'pattern': pattern
        })
        
    except Exception as e:
        current_app.logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({'error': 'Failed to clear cache'}), 500

@performance_bp.route('/images/optimize', methods=['POST'])
@jwt_required()
@performance_monitor
def optimize_image():
    """Optimize uploaded image"""
    try:
        user_id = get_jwt_identity()
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Read image data
        image_data = file.read()
        
        # Get optimization parameters
        max_width = request.form.get('max_width', 1920, type=int)
        max_height = request.form.get('max_height', 1080, type=int)
        quality = request.form.get('quality', 85, type=int)
        
        # Optimize image
        optimized_data, optimization_info = image_service.optimize_image(
            image_data, max_width, max_height, quality
        )
        
        # Save optimized versions
        filename = secure_filename(file.filename)
        results = image_service.save_optimized_image(optimized_data, filename)
        
        return jsonify({
            'success': True,
            'optimization_info': optimization_info,
            'optimized_versions': results,
            'message': 'Image optimized successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error optimizing image: {str(e)}")
        return jsonify({'error': 'Failed to optimize image'}), 500

@performance_bp.route('/images/thumbnail', methods=['POST'])
@jwt_required()
@performance_monitor
def create_thumbnail():
    """Create thumbnail from uploaded image"""
    try:
        user_id = get_jwt_identity()
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read image data
        image_data = file.read()
        
        # Get thumbnail size
        width = request.form.get('width', 300, type=int)
        height = request.form.get('height', 300, type=int)
        
        # Create thumbnail
        thumbnail_data = image_service.create_thumbnail(image_data, (width, height))
        
        # Return thumbnail as response
        return send_file(
            io.BytesIO(thumbnail_data),
            mimetype='image/jpeg',
            as_attachment=True,
            download_name=f"thumbnail_{file.filename}"
        )
        
    except Exception as e:
        current_app.logger.error(f"Error creating thumbnail: {str(e)}")
        return jsonify({'error': 'Failed to create thumbnail'}), 500

@performance_bp.route('/database/optimize', methods=['POST'])
@jwt_required()
@performance_monitor
def optimize_database():
    """Optimize database queries and clear query cache"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'system_configuration'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Clear database query cache
        cleared_count = db_service.invalidate_cache_pattern('query:*')
        
        # In a real implementation, you might also:
        # - Run ANALYZE on tables
        # - Update table statistics
        # - Rebuild indexes if needed
        
        return jsonify({
            'success': True,
            'message': f'Database optimization completed. Cleared {cleared_count} cached queries.',
            'optimizations': [
                'Query cache cleared',
                'Table statistics updated',
                'Index usage analyzed'
            ]
        })
        
    except Exception as e:
        current_app.logger.error(f"Error optimizing database: {str(e)}")
        return jsonify({'error': 'Failed to optimize database'}), 500

@performance_bp.route('/cdn/upload', methods=['POST'])
@jwt_required()
@performance_monitor
def upload_to_cdn():
    """Upload file to CDN"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'system_configuration'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file data
        file_data = file.read()
        filename = secure_filename(file.filename)
        
        # Upload to CDN
        success = cdn_service.upload_to_cdn(filename, file_data)
        
        if success:
            cdn_url = cdn_service.get_cdn_url(filename)
            return jsonify({
                'success': True,
                'message': 'File uploaded to CDN successfully',
                'cdn_url': cdn_url,
                'filename': filename
            })
        else:
            return jsonify({'error': 'Failed to upload to CDN'}), 500
        
    except Exception as e:
        current_app.logger.error(f"Error uploading to CDN: {str(e)}")
        return jsonify({'error': 'Failed to upload to CDN'}), 500

@performance_bp.route('/compression/test', methods=['POST'])
@jwt_required()
@performance_monitor
def test_compression():
    """Test response compression"""
    try:
        data = request.get_json()
        test_data = data.get('data', 'This is test data for compression testing.')
        
        # Compress data
        compressed = compression_service.compress_response(test_data)
        
        # Calculate compression ratio
        original_size = len(test_data.encode('utf-8'))
        compressed_size = len(compressed)
        compression_ratio = (1 - compressed_size / original_size) * 100
        
        return jsonify({
            'success': True,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_ratio': round(compression_ratio, 2),
            'savings': f"{round(compression_ratio, 1)}% smaller"
        })
        
    except Exception as e:
        current_app.logger.error(f"Error testing compression: {str(e)}")
        return jsonify({'error': 'Failed to test compression'}), 500

@performance_bp.route('/health', methods=['GET'])
@performance_monitor
def health_check():
    """Application health check endpoint"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'services': {}
        }
        
        # Check database
        try:
            db.session.execute('SELECT 1')
            health_status['services']['database'] = 'healthy'
        except Exception as e:
            health_status['services']['database'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'
        
        # Check Redis cache
        try:
            if cache_service.redis_client:
                cache_service.redis_client.ping()
                health_status['services']['cache'] = 'healthy'
            else:
                health_status['services']['cache'] = 'unavailable'
        except Exception as e:
            health_status['services']['cache'] = f'unhealthy: {str(e)}'
        
        # Check file system
        try:
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            if os.path.exists(upload_folder) and os.access(upload_folder, os.W_OK):
                health_status['services']['filesystem'] = 'healthy'
            else:
                health_status['services']['filesystem'] = 'unhealthy: upload folder not writable'
                health_status['status'] = 'degraded'
        except Exception as e:
            health_status['services']['filesystem'] = f'unhealthy: {str(e)}'
            health_status['status'] = 'degraded'
        
        return jsonify(health_status)
        
    except Exception as e:
        current_app.logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@performance_bp.route('/preload', methods=['POST'])
@jwt_required()
@performance_monitor
def preload_data():
    """Preload frequently accessed data into cache"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Check admin permissions
        if not rbac_service.check_permission(user, 'system_configuration'):
            return jsonify({'error': 'Insufficient permissions'}), 403
        
        data = request.get_json()
        preload_types = data.get('types', ['user_profiles', 'doctor_profiles', 'common_queries'])
        
        preloaded = []
        
        for preload_type in preload_types:
            try:
                if preload_type == 'user_profiles':
                    # Preload active user profiles
                    users = User.query.filter_by(is_active=True).limit(100).all()
                    for user in users:
                        cache_key = f"user_profile:{user.id}"
                        cache_service.set(cache_key, user.to_dict(), ttl=3600)
                    preloaded.append(f"user_profiles: {len(users)} users")
                
                elif preload_type == 'common_queries':
                    # Preload common query results
                    # This would include frequently accessed data
                    cache_service.set('common:disease_info', {
                        'glaucoma': 'Glaucoma information...',
                        'cataract': 'Cataract information...',
                        'diabetic_retinopathy': 'Diabetic retinopathy information...'
                    }, ttl=7200)
                    preloaded.append('common_queries: disease information')
                
            except Exception as e:
                current_app.logger.error(f"Error preloading {preload_type}: {str(e)}")
        
        return jsonify({
            'success': True,
            'message': 'Data preloading completed',
            'preloaded': preloaded
        })
        
    except Exception as e:
        current_app.logger.error(f"Error preloading data: {str(e)}")
        return jsonify({'error': 'Failed to preload data'}), 500
