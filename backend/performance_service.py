"""
Performance Service for optimization, caching, and image processing
"""

import os
import hashlib
import redis
import json
from PIL import Image, ImageOps
from io import BytesIO
import base64
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from flask import current_app
import gzip
import pickle
from functools import wraps
import time

class CacheService:
    """Service for Redis-based caching"""
    
    def __init__(self):
        self.redis_client = None
        self._initialized = False

    def _init_redis(self):
        """Initialize Redis connection"""
        if self._initialized:
            return

        try:
            redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            self.redis_client.ping()
        except Exception as e:
            try:
                current_app.logger.warning(f"Redis not available: {str(e)}")
            except:
                print(f"Redis not available: {str(e)}")
            self.redis_client = None
        finally:
            self._initialized = True
    
    def get(self, key: str) -> Any:
        """Get value from cache"""
        self._init_redis()
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            current_app.logger.error(f"Cache get error: {str(e)}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        self._init_redis()
        if not self.redis_client:
            return False
        
        try:
            serialized_data = json.dumps(value, default=str)
            return self.redis_client.setex(key, ttl, serialized_data)
        except Exception as e:
            current_app.logger.error(f"Cache set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        self._init_redis()
        if not self.redis_client:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            current_app.logger.error(f"Cache delete error: {str(e)}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        self._init_redis()
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
        except Exception as e:
            current_app.logger.error(f"Cache clear pattern error: {str(e)}")
        
        return 0

class ImageOptimizationService:
    """Service for image compression and optimization"""
    
    def __init__(self):
        self.cache_service = CacheService()
        self.upload_folder = None
        self.optimized_folder = None
        self._initialized = False

    def _initialize(self):
        """Initialize service within application context"""
        if not self._initialized:
            self.upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            self.optimized_folder = os.path.join(self.upload_folder, 'optimized')
            os.makedirs(self.optimized_folder, exist_ok=True)
            self._initialized = True
    
    def optimize_image(self, image_data: bytes, max_width: int = 1920,
                      max_height: int = 1080, quality: int = 85) -> Tuple[bytes, Dict]:
        """Optimize image for web delivery"""
        self._initialize()
        try:
            # Open image
            image = Image.open(BytesIO(image_data))
            original_size = len(image_data)
            
            # Get original dimensions
            original_width, original_height = image.size
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Calculate new dimensions
            ratio = min(max_width / original_width, max_height / original_height)
            if ratio < 1:
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Apply auto-orientation
            image = ImageOps.exif_transpose(image)
            
            # Save optimized image
            output = BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            optimized_data = output.getvalue()
            
            # Calculate compression ratio
            compression_ratio = (1 - len(optimized_data) / original_size) * 100
            
            optimization_info = {
                'original_size': original_size,
                'optimized_size': len(optimized_data),
                'compression_ratio': round(compression_ratio, 2),
                'original_dimensions': (original_width, original_height),
                'optimized_dimensions': image.size,
                'quality': quality
            }
            
            return optimized_data, optimization_info
            
        except Exception as e:
            current_app.logger.error(f"Image optimization failed: {str(e)}")
            return image_data, {'error': str(e)}
    
    def create_thumbnail(self, image_data: bytes, size: Tuple[int, int] = (300, 300)) -> bytes:
        """Create thumbnail from image"""
        try:
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background
            
            # Create thumbnail
            image.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            output = BytesIO()
            image.save(output, format='JPEG', quality=80, optimize=True)
            
            return output.getvalue()
            
        except Exception as e:
            current_app.logger.error(f"Thumbnail creation failed: {str(e)}")
            return image_data
    
    def get_image_hash(self, image_data: bytes) -> str:
        """Generate hash for image deduplication"""
        return hashlib.md5(image_data).hexdigest()
    
    def save_optimized_image(self, image_data: bytes, filename: str) -> Dict:
        """Save optimized image with multiple sizes"""
        try:
            # Generate hash for deduplication
            image_hash = self.get_image_hash(image_data)
            
            # Check if already optimized
            cache_key = f"optimized_image:{image_hash}"
            cached_result = self.cache_service.get(cache_key)
            if cached_result:
                return cached_result
            
            # Create different sizes
            sizes = {
                'original': (1920, 1080),
                'large': (1200, 800),
                'medium': (800, 600),
                'small': (400, 300),
                'thumbnail': (150, 150)
            }
            
            results = {}
            
            for size_name, (max_width, max_height) in sizes.items():
                if size_name == 'thumbnail':
                    optimized_data = self.create_thumbnail(image_data, (max_width, max_height))
                    optimization_info = {'size': len(optimized_data)}
                else:
                    optimized_data, optimization_info = self.optimize_image(
                        image_data, max_width, max_height
                    )
                
                # Save to file
                size_filename = f"{image_hash}_{size_name}.jpg"
                file_path = os.path.join(self.optimized_folder, size_filename)
                
                with open(file_path, 'wb') as f:
                    f.write(optimized_data)
                
                results[size_name] = {
                    'filename': size_filename,
                    'path': file_path,
                    'url': f'/uploads/optimized/{size_filename}',
                    'size': len(optimized_data),
                    **optimization_info
                }
            
            # Cache results
            self.cache_service.set(cache_key, results, ttl=86400)  # 24 hours
            
            return results
            
        except Exception as e:
            current_app.logger.error(f"Failed to save optimized image: {str(e)}")
            return {'error': str(e)}

class DatabaseOptimizationService:
    """Service for database query optimization"""
    
    def __init__(self):
        self.cache_service = CacheService()
        self.query_cache_ttl = 300  # 5 minutes
    
    def cached_query(self, cache_key: str, query_func, *args, **kwargs):
        """Execute query with caching"""
        # Check cache first
        cached_result = self.cache_service.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Execute query
        result = query_func(*args, **kwargs)
        
        # Cache result
        if result is not None:
            self.cache_service.set(cache_key, result, self.query_cache_ttl)
        
        return result
    
    def invalidate_cache_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        return self.cache_service.clear_pattern(pattern)

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{hashlib.md5(str(args + tuple(kwargs.items())).encode()).hexdigest()}"
            
            # Try to get from cache
            cache_service = CacheService()
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

class PerformanceMonitor:
    """Service for monitoring application performance"""
    
    def __init__(self):
        self.cache_service = CacheService()
    
    def track_request_time(self, endpoint: str, duration: float):
        """Track request processing time"""
        try:
            # Store in cache for real-time monitoring
            key = f"perf:request_times:{endpoint}"
            times = self.cache_service.get(key) or []
            
            # Keep only last 100 requests
            times.append({
                'timestamp': datetime.utcnow().isoformat(),
                'duration': duration
            })
            times = times[-100:]
            
            self.cache_service.set(key, times, ttl=3600)
            
        except Exception as e:
            current_app.logger.error(f"Performance tracking error: {str(e)}")
    
    def get_performance_metrics(self) -> Dict:
        """Get performance metrics"""
        try:
            metrics = {
                'request_times': {},
                'cache_stats': {},
                'memory_usage': {},
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Get request times for all endpoints
            pattern = "perf:request_times:*"
            if self.cache_service.redis_client:
                keys = self.cache_service.redis_client.keys(pattern)
                for key in keys:
                    endpoint = key.split(':')[-1]
                    times = self.cache_service.get(key) or []
                    
                    if times:
                        durations = [t['duration'] for t in times]
                        metrics['request_times'][endpoint] = {
                            'avg': sum(durations) / len(durations),
                            'min': min(durations),
                            'max': max(durations),
                            'count': len(durations)
                        }
            
            # Get cache statistics
            if self.cache_service.redis_client:
                info = self.cache_service.redis_client.info()
                metrics['cache_stats'] = {
                    'used_memory': info.get('used_memory_human', 'N/A'),
                    'connected_clients': info.get('connected_clients', 0),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0)
                }
                
                # Calculate hit rate
                hits = info.get('keyspace_hits', 0)
                misses = info.get('keyspace_misses', 0)
                if hits + misses > 0:
                    metrics['cache_stats']['hit_rate'] = round(hits / (hits + misses) * 100, 2)
            
            return metrics
            
        except Exception as e:
            current_app.logger.error(f"Error getting performance metrics: {str(e)}")
            return {'error': str(e)}

def performance_monitor(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.time() - start_time
            
            # Track performance
            monitor = PerformanceMonitor()
            endpoint = getattr(func, '__name__', 'unknown')
            monitor.track_request_time(endpoint, duration)
            
            # Log slow requests
            if duration > 2.0:  # Log requests taking more than 2 seconds
                current_app.logger.warning(f"Slow request: {endpoint} took {duration:.2f}s")
    
    return wrapper

class CompressionService:
    """Service for response compression"""
    
    @staticmethod
    def compress_response(data: str) -> bytes:
        """Compress response data using gzip"""
        try:
            return gzip.compress(data.encode('utf-8'))
        except Exception as e:
            current_app.logger.error(f"Compression error: {str(e)}")
            return data.encode('utf-8')
    
    @staticmethod
    def decompress_response(data: bytes) -> str:
        """Decompress gzipped data"""
        try:
            return gzip.decompress(data).decode('utf-8')
        except Exception as e:
            current_app.logger.error(f"Decompression error: {str(e)}")
            return data.decode('utf-8')

class CDNService:
    """Service for CDN integration"""
    
    def __init__(self):
        self.cdn_base_url = None
        self.cache_service = CacheService()
        self._initialized = False

    def _initialize(self):
        """Initialize service within application context"""
        if not self._initialized:
            self.cdn_base_url = current_app.config.get('CDN_BASE_URL', '')
            self._initialized = True
    
    def get_cdn_url(self, file_path: str) -> str:
        """Get CDN URL for file"""
        self._initialize()
        if self.cdn_base_url:
            return f"{self.cdn_base_url.rstrip('/')}/{file_path.lstrip('/')}"
        return file_path
    
    def upload_to_cdn(self, file_path: str, file_data: bytes) -> bool:
        """Upload file to CDN (placeholder for actual CDN integration)"""
        try:
            # In a real implementation, this would upload to AWS CloudFront,
            # Cloudflare, or another CDN service
            
            # For now, just mark as uploaded in cache
            cache_key = f"cdn:uploaded:{file_path}"
            self.cache_service.set(cache_key, True, ttl=86400)
            
            return True
            
        except Exception as e:
            current_app.logger.error(f"CDN upload error: {str(e)}")
            return False
    
    def is_uploaded_to_cdn(self, file_path: str) -> bool:
        """Check if file is uploaded to CDN"""
        cache_key = f"cdn:uploaded:{file_path}"
        return bool(self.cache_service.get(cache_key))
