"""
Production Monitoring and Alerting System for Supabase Medical Research Backend
Comprehensive monitoring with real-time alerts and performance tracking
"""

import os
import sys
import time
import json
import logging
import smtplib
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import psutil
import requests
from dataclasses import dataclass, asdict

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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class AlertThreshold:
    """Alert threshold configuration"""
    metric_name: str
    warning_threshold: float
    critical_threshold: float
    unit: str
    description: str

@dataclass
class SystemMetrics:
    """System performance metrics"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    database_connections: int
    response_time_ms: float
    error_rate: float
    storage_usage_mb: float
    active_users: int

@dataclass
class SecurityMetrics:
    """Security-related metrics"""
    timestamp: datetime
    failed_logins: int
    suspicious_activities: int
    rate_limit_violations: int
    unauthorized_access_attempts: int
    data_access_volume: int

@dataclass
class Alert:
    """Alert object"""
    alert_id: str
    severity: str  # 'info', 'warning', 'critical'
    metric_name: str
    current_value: float
    threshold_value: float
    message: str
    timestamp: datetime
    resolved: bool = False

class MonitoringSystem:
    """Comprehensive monitoring system for medical research backend"""
    
    def __init__(self):
        self.db = MedicalResearchDB()
        self.alerts: List[Alert] = []
        self.alert_thresholds = self._load_alert_thresholds()
        self.monitoring_interval = 60  # seconds
        self.alert_cooldown = 300  # 5 minutes
        self.last_alerts: Dict[str, datetime] = {}
        
    def _load_alert_thresholds(self) -> List[AlertThreshold]:
        """Load alert thresholds configuration"""
        return [
            AlertThreshold("cpu_usage", 70.0, 90.0, "%", "CPU usage percentage"),
            AlertThreshold("memory_usage", 80.0, 95.0, "%", "Memory usage percentage"),
            AlertThreshold("disk_usage", 85.0, 95.0, "%", "Disk usage percentage"),
            AlertThreshold("response_time_ms", 1000.0, 5000.0, "ms", "Database response time"),
            AlertThreshold("error_rate", 5.0, 15.0, "%", "Error rate percentage"),
            AlertThreshold("failed_logins", 10, 50, "count", "Failed login attempts per hour"),
            AlertThreshold("suspicious_activities", 5, 20, "count", "Suspicious activities per hour"),
            AlertThreshold("storage_usage_mb", 10000, 50000, "MB", "Storage usage in megabytes"),
            AlertThreshold("database_connections", 80, 95, "count", "Active database connections")
        ]
    
    def collect_system_metrics(self) -> SystemMetrics:
        """Collect system performance metrics"""
        try:
            # System metrics
            cpu_usage = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Database metrics
            start_time = time.time()
            db_healthy = self.db.health_check()
            response_time_ms = (time.time() - start_time) * 1000
            
            # Get database statistics
            db_stats = self.db.get_database_stats() if db_healthy else {}
            
            # Calculate error rate (simplified - would need actual error tracking)
            error_rate = 0.0  # Placeholder
            
            # Get storage usage
            storage_usage_mb = 0
            try:
                # This would need to be implemented in the database client
                storage_info = self.db.supabase.postgrest.from_('storage.objects').select('metadata').eq('bucket_id', 'fundus-images').execute()
                if storage_info.data:
                    total_size = sum(int(obj.get('metadata', {}).get('size', 0)) for obj in storage_info.data)
                    storage_usage_mb = total_size / (1024 * 1024)
            except Exception as e:
                logger.warning(f"Could not get storage usage: {e}")
            
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_usage=cpu_usage,
                memory_usage=memory.percent,
                disk_usage=disk.percent,
                database_connections=len(db_stats),  # Simplified
                response_time_ms=response_time_ms,
                error_rate=error_rate,
                storage_usage_mb=storage_usage_mb,
                active_users=0  # Would need session tracking
            )
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_usage=0, memory_usage=0, disk_usage=0,
                database_connections=0, response_time_ms=0,
                error_rate=100, storage_usage_mb=0, active_users=0
            )
    
    def collect_security_metrics(self) -> SecurityMetrics:
        """Collect security-related metrics"""
        try:
            # Get security metrics from database
            security_data = self.db.supabase.rpc('get_security_metrics').execute()
            
            if security_data.data:
                metrics = security_data.data
                return SecurityMetrics(
                    timestamp=datetime.now(),
                    failed_logins=metrics.get('failed_operations', 0),
                    suspicious_activities=metrics.get('suspicious_activities', 0),
                    rate_limit_violations=0,  # Would need implementation
                    unauthorized_access_attempts=0,  # Would need implementation
                    data_access_volume=metrics.get('total_operations', 0)
                )
            else:
                return SecurityMetrics(
                    timestamp=datetime.now(),
                    failed_logins=0, suspicious_activities=0,
                    rate_limit_violations=0, unauthorized_access_attempts=0,
                    data_access_volume=0
                )
                
        except Exception as e:
            logger.error(f"Error collecting security metrics: {e}")
            return SecurityMetrics(
                timestamp=datetime.now(),
                failed_logins=0, suspicious_activities=0,
                rate_limit_violations=0, unauthorized_access_attempts=0,
                data_access_volume=0
            )
    
    def check_thresholds(self, system_metrics: SystemMetrics, security_metrics: SecurityMetrics) -> List[Alert]:
        """Check metrics against thresholds and generate alerts"""
        alerts = []
        current_time = datetime.now()
        
        # Combine metrics for threshold checking
        all_metrics = {
            'cpu_usage': system_metrics.cpu_usage,
            'memory_usage': system_metrics.memory_usage,
            'disk_usage': system_metrics.disk_usage,
            'response_time_ms': system_metrics.response_time_ms,
            'error_rate': system_metrics.error_rate,
            'failed_logins': security_metrics.failed_logins,
            'suspicious_activities': security_metrics.suspicious_activities,
            'storage_usage_mb': system_metrics.storage_usage_mb,
            'database_connections': system_metrics.database_connections
        }
        
        for threshold in self.alert_thresholds:
            metric_value = all_metrics.get(threshold.metric_name, 0)
            
            # Check if we should skip due to cooldown
            last_alert_time = self.last_alerts.get(threshold.metric_name)
            if last_alert_time and (current_time - last_alert_time).seconds < self.alert_cooldown:
                continue
            
            # Check critical threshold
            if metric_value >= threshold.critical_threshold:
                alert = Alert(
                    alert_id=f"{threshold.metric_name}_{int(current_time.timestamp())}",
                    severity='critical',
                    metric_name=threshold.metric_name,
                    current_value=metric_value,
                    threshold_value=threshold.critical_threshold,
                    message=f"CRITICAL: {threshold.description} is {metric_value}{threshold.unit} (threshold: {threshold.critical_threshold}{threshold.unit})",
                    timestamp=current_time
                )
                alerts.append(alert)
                self.last_alerts[threshold.metric_name] = current_time
                
            # Check warning threshold
            elif metric_value >= threshold.warning_threshold:
                alert = Alert(
                    alert_id=f"{threshold.metric_name}_{int(current_time.timestamp())}",
                    severity='warning',
                    metric_name=threshold.metric_name,
                    current_value=metric_value,
                    threshold_value=threshold.warning_threshold,
                    message=f"WARNING: {threshold.description} is {metric_value}{threshold.unit} (threshold: {threshold.warning_threshold}{threshold.unit})",
                    timestamp=current_time
                )
                alerts.append(alert)
                self.last_alerts[threshold.metric_name] = current_time
        
        return alerts
    
    def send_alert_notification(self, alert: Alert):
        """Send alert notification via email/webhook"""
        try:
            # Email notification
            if os.getenv('SMTP_ENABLED', 'false').lower() == 'true':
                self._send_email_alert(alert)
            
            # Webhook notification
            webhook_url = os.getenv('ALERT_WEBHOOK_URL')
            if webhook_url:
                self._send_webhook_alert(alert, webhook_url)
            
            # Log alert
            logger.warning(f"ALERT [{alert.severity.upper()}]: {alert.message}")
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")
    
    def _send_email_alert(self, alert: Alert):
        """Send email alert"""
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        alert_email = os.getenv('ALERT_EMAIL')
        
        if not all([smtp_server, smtp_username, smtp_password, alert_email]):
            logger.warning("Email configuration incomplete, skipping email alert")
            return
        
        msg = MimeMultipart()
        msg['From'] = smtp_username
        msg['To'] = alert_email
        msg['Subject'] = f"[{alert.severity.upper()}] Medical Research Backend Alert"
        
        body = f"""
        Alert Details:
        - Severity: {alert.severity.upper()}
        - Metric: {alert.metric_name}
        - Current Value: {alert.current_value}
        - Threshold: {alert.threshold_value}
        - Message: {alert.message}
        - Timestamp: {alert.timestamp}
        
        Please investigate immediately.
        """
        
        msg.attach(MimeText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
    
    def _send_webhook_alert(self, alert: Alert, webhook_url: str):
        """Send webhook alert"""
        payload = {
            'alert_id': alert.alert_id,
            'severity': alert.severity,
            'metric_name': alert.metric_name,
            'current_value': alert.current_value,
            'threshold_value': alert.threshold_value,
            'message': alert.message,
            'timestamp': alert.timestamp.isoformat(),
            'service': 'medical-research-backend'
        }
        
        response = requests.post(
            webhook_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()
    
    def store_metrics(self, system_metrics: SystemMetrics, security_metrics: SecurityMetrics):
        """Store metrics in database for historical analysis"""
        try:
            # Store in a metrics table (would need to be created)
            metrics_data = {
                'timestamp': system_metrics.timestamp.isoformat(),
                'system_metrics': asdict(system_metrics),
                'security_metrics': asdict(security_metrics)
            }
            
            # This would require a metrics table in the database
            # For now, just log the metrics
            logger.info(f"Metrics collected: CPU={system_metrics.cpu_usage}%, "
                       f"Memory={system_metrics.memory_usage}%, "
                       f"Disk={system_metrics.disk_usage}%, "
                       f"Response={system_metrics.response_time_ms}ms")
            
        except Exception as e:
            logger.error(f"Error storing metrics: {e}")
    
    def generate_health_report(self) -> Dict[str, Any]:
        """Generate comprehensive health report"""
        system_metrics = self.collect_system_metrics()
        security_metrics = self.collect_security_metrics()
        
        # Get database statistics
        try:
            db_stats = self.db.get_database_stats()
        except Exception:
            db_stats = {}
        
        # Calculate health score (0-100)
        health_score = 100
        if system_metrics.cpu_usage > 80:
            health_score -= 20
        if system_metrics.memory_usage > 85:
            health_score -= 20
        if system_metrics.response_time_ms > 2000:
            health_score -= 15
        if system_metrics.error_rate > 5:
            health_score -= 25
        if security_metrics.suspicious_activities > 10:
            health_score -= 20
        
        health_score = max(0, health_score)
        
        return {
            'timestamp': datetime.now().isoformat(),
            'health_score': health_score,
            'status': 'healthy' if health_score >= 80 else 'degraded' if health_score >= 60 else 'unhealthy',
            'system_metrics': asdict(system_metrics),
            'security_metrics': asdict(security_metrics),
            'database_stats': db_stats,
            'active_alerts': len([a for a in self.alerts if not a.resolved]),
            'uptime_hours': self._get_uptime_hours()
        }
    
    def _get_uptime_hours(self) -> float:
        """Get system uptime in hours"""
        try:
            return psutil.boot_time() / 3600
        except Exception:
            return 0.0
    
    async def run_monitoring_loop(self):
        """Main monitoring loop"""
        logger.info("Starting monitoring system...")
        
        while True:
            try:
                # Collect metrics
                system_metrics = self.collect_system_metrics()
                security_metrics = self.collect_security_metrics()
                
                # Check thresholds and generate alerts
                new_alerts = self.check_thresholds(system_metrics, security_metrics)
                
                # Send notifications for new alerts
                for alert in new_alerts:
                    self.send_alert_notification(alert)
                    self.alerts.append(alert)
                
                # Store metrics
                self.store_metrics(system_metrics, security_metrics)
                
                # Clean up old alerts (keep last 100)
                if len(self.alerts) > 100:
                    self.alerts = self.alerts[-100:]
                
                logger.info(f"Monitoring cycle completed. Health score: {self.generate_health_report()['health_score']}")
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            # Wait for next monitoring cycle
            await asyncio.sleep(self.monitoring_interval)
    
    def run_health_check(self) -> bool:
        """Run a quick health check"""
        try:
            # Check database connectivity
            if not self.db.health_check():
                logger.error("Database health check failed")
                return False
            
            # Check system resources
            if psutil.cpu_percent() > 95:
                logger.error("CPU usage critically high")
                return False
            
            if psutil.virtual_memory().percent > 95:
                logger.error("Memory usage critically high")
                return False
            
            logger.info("Health check passed")
            return True
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

def main():
    """Main monitoring function"""
    monitor = MonitoringSystem()
    
    # Run health check first
    if not monitor.run_health_check():
        logger.error("Initial health check failed")
        return
    
    # Generate and print health report
    health_report = monitor.generate_health_report()
    print(json.dumps(health_report, indent=2))
    
    # Start monitoring loop if requested
    if len(sys.argv) > 1 and sys.argv[1] == '--monitor':
        try:
            asyncio.run(monitor.run_monitoring_loop())
        except KeyboardInterrupt:
            logger.info("Monitoring stopped by user")
        except Exception as e:
            logger.error(f"Monitoring failed: {e}")

if __name__ == "__main__":
    main()
