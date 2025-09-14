-- Advanced Row-Level Security Policies for Production
-- Enhanced security for multi-tenant medical research environment

-- ============================================================================
-- ENHANCED RLS POLICIES FOR PRODUCTION
-- ============================================================================

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "researchers_can_access_patients" ON patients;
DROP POLICY IF EXISTS "ml_pipelines_can_read_patients" ON patients;
DROP POLICY IF EXISTS "researchers_can_access_eyes" ON eyes;
DROP POLICY IF EXISTS "ml_pipelines_can_read_eyes" ON eyes;
DROP POLICY IF EXISTS "researchers_can_access_fundus_images" ON fundus_images;
DROP POLICY IF EXISTS "ml_pipelines_can_read_fundus_images" ON fundus_images;
DROP POLICY IF EXISTS "researchers_can_access_refractive_measurements" ON refractive_measurements;
DROP POLICY IF EXISTS "ml_pipelines_can_read_refractive_measurements" ON refractive_measurements;
DROP POLICY IF EXISTS "researchers_can_access_model_training_logs" ON model_training_logs;
DROP POLICY IF EXISTS "ml_pipelines_can_read_model_training_logs" ON model_training_logs;

-- ============================================================================
-- ENHANCED HELPER FUNCTIONS
-- ============================================================================

-- Enhanced role checking with organization support
CREATE OR REPLACE FUNCTION get_user_role() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        auth.jwt() ->> 'role',
        (auth.jwt() -> 'user_metadata' ->> 'role'),
        'anonymous'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user organization
CREATE OR REPLACE FUNCTION get_user_organization() RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        auth.jwt() ->> 'organization',
        (auth.jwt() -> 'user_metadata' ->> 'organization'),
        'default'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is researcher with proper organization access
CREATE OR REPLACE FUNCTION is_researcher_with_access() RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'researcher' AND auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is ML pipeline with read access
CREATE OR REPLACE FUNCTION is_ml_pipeline_with_access() RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'ml_pipeline' AND auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin' AND auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting function
CREATE OR REPLACE FUNCTION check_rate_limit(
    operation_type TEXT,
    max_operations INTEGER DEFAULT 100,
    time_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID := auth.uid();
    operation_count INTEGER;
BEGIN
    -- Skip rate limiting for admin users
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Count operations in the time window
    SELECT COUNT(*)
    INTO operation_count
    FROM audit_log
    WHERE user_id = check_rate_limit.user_id
      AND operation = operation_type
      AND created_at > NOW() - INTERVAL '1 minute' * time_window_minutes;
    
    RETURN operation_count < max_operations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENHANCED PATIENTS TABLE POLICIES
-- ============================================================================

-- Researchers can access patients with rate limiting
CREATE POLICY "researchers_can_access_patients_enhanced" ON patients
    FOR ALL TO authenticated
    USING (
        is_researcher_with_access() 
        AND check_rate_limit('patient_access', 1000, 60)
    )
    WITH CHECK (
        is_researcher_with_access() 
        AND check_rate_limit('patient_create', 50, 60)
    );

-- ML pipelines can read patients with rate limiting
CREATE POLICY "ml_pipelines_can_read_patients_enhanced" ON patients
    FOR SELECT TO authenticated
    USING (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('patient_read', 5000, 60)
    );

-- Admins have full access
CREATE POLICY "admins_full_access_patients" ON patients
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ENHANCED EYES TABLE POLICIES
-- ============================================================================

-- Researchers can access eyes with rate limiting
CREATE POLICY "researchers_can_access_eyes_enhanced" ON eyes
    FOR ALL TO authenticated
    USING (
        is_researcher_with_access() 
        AND check_rate_limit('eye_access', 2000, 60)
    )
    WITH CHECK (
        is_researcher_with_access() 
        AND check_rate_limit('eye_create', 100, 60)
    );

-- ML pipelines can read eyes with rate limiting
CREATE POLICY "ml_pipelines_can_read_eyes_enhanced" ON eyes
    FOR SELECT TO authenticated
    USING (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('eye_read', 10000, 60)
    );

-- Admins have full access
CREATE POLICY "admins_full_access_eyes" ON eyes
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ENHANCED FUNDUS IMAGES TABLE POLICIES
-- ============================================================================

-- Researchers can access fundus images with rate limiting
CREATE POLICY "researchers_can_access_fundus_images_enhanced" ON fundus_images
    FOR ALL TO authenticated
    USING (
        is_researcher_with_access() 
        AND check_rate_limit('image_access', 500, 60)
    )
    WITH CHECK (
        is_researcher_with_access() 
        AND check_rate_limit('image_upload', 20, 60)
    );

-- ML pipelines can read fundus images with rate limiting
CREATE POLICY "ml_pipelines_can_read_fundus_images_enhanced" ON fundus_images
    FOR SELECT TO authenticated
    USING (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('image_read', 2000, 60)
    );

-- Admins have full access
CREATE POLICY "admins_full_access_fundus_images" ON fundus_images
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ENHANCED REFRACTIVE MEASUREMENTS TABLE POLICIES
-- ============================================================================

-- Researchers can access refractive measurements with rate limiting
CREATE POLICY "researchers_can_access_refractive_measurements_enhanced" ON refractive_measurements
    FOR ALL TO authenticated
    USING (
        is_researcher_with_access() 
        AND check_rate_limit('measurement_access', 1000, 60)
    )
    WITH CHECK (
        is_researcher_with_access() 
        AND check_rate_limit('measurement_create', 100, 60)
    );

-- ML pipelines can read refractive measurements with rate limiting
CREATE POLICY "ml_pipelines_can_read_refractive_measurements_enhanced" ON refractive_measurements
    FOR SELECT TO authenticated
    USING (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('measurement_read', 5000, 60)
    );

-- Admins have full access
CREATE POLICY "admins_full_access_refractive_measurements" ON refractive_measurements
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ENHANCED MODEL TRAINING LOGS TABLE POLICIES
-- ============================================================================

-- Researchers can read model training logs
CREATE POLICY "researchers_can_read_model_training_logs_enhanced" ON model_training_logs
    FOR SELECT TO authenticated
    USING (
        is_researcher_with_access() 
        AND check_rate_limit('training_log_read', 200, 60)
    );

-- ML pipelines can create and read model training logs
CREATE POLICY "ml_pipelines_can_access_model_training_logs_enhanced" ON model_training_logs
    FOR ALL TO authenticated
    USING (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('training_log_access', 100, 60)
    )
    WITH CHECK (
        is_ml_pipeline_with_access() 
        AND check_rate_limit('training_log_create', 10, 60)
    );

-- Admins have full access
CREATE POLICY "admins_full_access_model_training_logs" ON model_training_logs
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- ENHANCED AUDIT LOG POLICIES
-- ============================================================================

-- Only admins can read audit logs
CREATE POLICY "admins_can_read_audit_logs" ON audit_log
    FOR SELECT TO authenticated
    USING (is_admin());

-- All authenticated users can create audit logs (for their own actions)
CREATE POLICY "users_can_create_audit_logs" ON audit_log
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STORAGE POLICIES ENHANCEMENT
-- ============================================================================

-- Enhanced storage policies with rate limiting
CREATE OR REPLACE FUNCTION check_storage_rate_limit() RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_rate_limit('storage_upload', 50, 60);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing storage policies
DROP POLICY IF EXISTS "researchers_can_upload_fundus_images" ON storage.objects;
DROP POLICY IF EXISTS "researchers_can_read_fundus_images" ON storage.objects;
DROP POLICY IF EXISTS "ml_pipelines_can_read_fundus_images" ON storage.objects;

-- Enhanced storage policies
CREATE POLICY "researchers_can_upload_fundus_images_enhanced" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'fundus-images' 
        AND is_researcher_with_access()
        AND check_storage_rate_limit()
    );

CREATE POLICY "researchers_can_read_fundus_images_enhanced" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'fundus-images' 
        AND is_researcher_with_access()
    );

CREATE POLICY "ml_pipelines_can_read_fundus_images_enhanced" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'fundus-images' 
        AND is_ml_pipeline_with_access()
    );

CREATE POLICY "admins_full_access_storage" ON storage.objects
    FOR ALL TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================================
-- SECURITY MONITORING FUNCTIONS
-- ============================================================================

-- Function to detect suspicious activity
CREATE OR REPLACE FUNCTION detect_suspicious_activity() RETURNS TABLE(
    user_id UUID,
    suspicious_activity TEXT,
    activity_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    -- Detect high-frequency access patterns
    SELECT 
        al.user_id,
        'High frequency access: ' || al.operation AS suspicious_activity,
        COUNT(*) AS activity_count,
        MAX(al.created_at) AS last_activity
    FROM audit_log al
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY al.user_id, al.operation
    HAVING COUNT(*) > 1000
    
    UNION ALL
    
    -- Detect access outside normal hours (assuming 9 AM - 6 PM)
    SELECT 
        al.user_id,
        'Access outside normal hours' AS suspicious_activity,
        COUNT(*) AS activity_count,
        MAX(al.created_at) AS last_activity
    FROM audit_log al
    WHERE al.created_at > NOW() - INTERVAL '24 hours'
      AND (EXTRACT(HOUR FROM al.created_at) < 9 OR EXTRACT(HOUR FROM al.created_at) > 18)
    GROUP BY al.user_id
    HAVING COUNT(*) > 50
    
    UNION ALL
    
    -- Detect failed authentication attempts
    SELECT 
        al.user_id,
        'Multiple failed operations' AS suspicious_activity,
        COUNT(*) AS activity_count,
        MAX(al.created_at) AS last_activity
    FROM audit_log al
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
      AND al.operation_status = 'failed'
    GROUP BY al.user_id
    HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get security metrics
CREATE OR REPLACE FUNCTION get_security_metrics() RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(DISTINCT user_id) FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours'),
        'total_operations', (SELECT COUNT(*) FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours'),
        'failed_operations', (SELECT COUNT(*) FROM audit_log WHERE created_at > NOW() - INTERVAL '24 hours' AND operation_status = 'failed'),
        'suspicious_activities', (SELECT COUNT(*) FROM detect_suspicious_activity()),
        'active_sessions', (SELECT COUNT(DISTINCT user_id) FROM audit_log WHERE created_at > NOW() - INTERVAL '1 hour'),
        'storage_usage_mb', (SELECT COALESCE(SUM(metadata->>'size')::BIGINT / 1024 / 1024, 0) FROM storage.objects WHERE bucket_id = 'fundus-images'),
        'last_updated', NOW()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA RETENTION POLICIES
-- ============================================================================

-- Function to clean old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO audit_log (user_id, operation, table_name, operation_status, details)
    VALUES (
        '00000000-0000-0000-0000-000000000000'::UUID,
        'cleanup_audit_logs',
        'audit_log',
        'success',
        json_build_object('deleted_records', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BACKUP AND RECOVERY FUNCTIONS
-- ============================================================================

-- Function to create data export for backup
CREATE OR REPLACE FUNCTION create_data_export() RETURNS JSON AS $$
DECLARE
    export_data JSON;
BEGIN
    SELECT json_build_object(
        'export_timestamp', NOW(),
        'patients_count', (SELECT COUNT(*) FROM patients),
        'eyes_count', (SELECT COUNT(*) FROM eyes),
        'images_count', (SELECT COUNT(*) FROM fundus_images),
        'measurements_count', (SELECT COUNT(*) FROM refractive_measurements),
        'training_logs_count', (SELECT COUNT(*) FROM model_training_logs),
        'storage_objects_count', (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'fundus-images')
    ) INTO export_data;
    
    RETURN export_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE ENHANCED RLS
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE eyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundus_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE refractive_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant storage permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

COMMENT ON FUNCTION get_user_role() IS 'Enhanced function to get user role with fallback options';
COMMENT ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) IS 'Rate limiting function to prevent abuse';
COMMENT ON FUNCTION detect_suspicious_activity() IS 'Security monitoring function to detect unusual patterns';
COMMENT ON FUNCTION get_security_metrics() IS 'Function to get comprehensive security metrics';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Data retention function to clean old audit logs';
COMMENT ON FUNCTION create_data_export() IS 'Backup function to export data statistics';
