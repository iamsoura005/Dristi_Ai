-- =====================================================
-- Supabase Authentication & Row-Level Security Setup
-- For Medical Research Data Access Control
-- =====================================================

-- =====================================================
-- 1. ENABLE ROW-LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE eyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundus_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE refractive_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_training_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. CREATE CUSTOM ROLES
-- =====================================================

-- Note: In Supabase, we use custom claims in JWT tokens
-- These functions help identify user roles from auth.users metadata

-- Function to check if user is a researcher
CREATE OR REPLACE FUNCTION is_researcher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' = 'researcher' OR
        auth.jwt() ->> 'user_role' = 'researcher' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is ML pipeline
CREATE OR REPLACE FUNCTION is_ml_pipeline()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'role' = 'ml_pipeline' OR
        auth.jwt() ->> 'user_role' = 'ml_pipeline' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'ml_pipeline'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has read access
CREATE OR REPLACE FUNCTION has_read_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (is_researcher() OR is_ml_pipeline());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has write access
CREATE OR REPLACE FUNCTION has_write_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_researcher();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RLS POLICIES FOR PATIENTS TABLE
-- =====================================================

-- Researchers: Full access (SELECT, INSERT, UPDATE)
CREATE POLICY "researchers_full_access_patients" ON patients
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- ML Pipeline: Read-only access
CREATE POLICY "ml_pipeline_read_patients" ON patients
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());

-- =====================================================
-- 4. RLS POLICIES FOR EYES TABLE
-- =====================================================

-- Researchers: Full access
CREATE POLICY "researchers_full_access_eyes" ON eyes
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- ML Pipeline: Read-only access
CREATE POLICY "ml_pipeline_read_eyes" ON eyes
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());

-- =====================================================
-- 5. RLS POLICIES FOR FUNDUS_IMAGES TABLE
-- =====================================================

-- Researchers: Full access
CREATE POLICY "researchers_full_access_fundus_images" ON fundus_images
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- ML Pipeline: Read-only access
CREATE POLICY "ml_pipeline_read_fundus_images" ON fundus_images
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());

-- =====================================================
-- 6. RLS POLICIES FOR REFRACTIVE_MEASUREMENTS TABLE
-- =====================================================

-- Researchers: Full access
CREATE POLICY "researchers_full_access_refractive_measurements" ON refractive_measurements
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- ML Pipeline: Read-only access
CREATE POLICY "ml_pipeline_read_refractive_measurements" ON refractive_measurements
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());

-- =====================================================
-- 7. RLS POLICIES FOR MODEL_TRAINING_LOGS TABLE
-- =====================================================

-- Researchers: Full access
CREATE POLICY "researchers_full_access_model_training_logs" ON model_training_logs
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- ML Pipeline: Read-only access (can view training history)
CREATE POLICY "ml_pipeline_read_model_training_logs" ON model_training_logs
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());

-- =====================================================
-- 8. STORAGE POLICIES FOR FUNDUS IMAGES BUCKET
-- =====================================================

-- Note: These policies are applied in Supabase Dashboard or via API
-- Storage bucket: 'fundus-images'

-- Policy for researchers to upload images
-- INSERT policy: Allow researchers to upload
-- SELECT policy: Allow authenticated users to view
-- UPDATE policy: Allow researchers to update
-- DELETE policy: Allow researchers to delete

-- Example storage policies (to be applied via Supabase Dashboard):
/*
-- Upload policy for researchers
CREATE POLICY "researchers_can_upload" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'fundus-images' AND
        is_researcher()
    );

-- View policy for authenticated users
CREATE POLICY "authenticated_can_view" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        has_read_access()
    );

-- Update policy for researchers
CREATE POLICY "researchers_can_update" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        is_researcher()
    );

-- Delete policy for researchers
CREATE POLICY "researchers_can_delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        is_researcher()
    );
*/

-- =====================================================
-- 9. HELPER FUNCTIONS FOR USER MANAGEMENT
-- =====================================================

-- Function to create a researcher user
CREATE OR REPLACE FUNCTION create_researcher_user(
    user_email TEXT,
    user_password TEXT,
    user_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be handled by Supabase Auth API
    -- This is a placeholder for documentation
    RAISE NOTICE 'Use Supabase Auth API to create user with role: researcher';
    RAISE NOTICE 'Email: %, Name: %', user_email, user_name;
    
    -- Return a placeholder UUID
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create an ML pipeline user
CREATE OR REPLACE FUNCTION create_ml_pipeline_user(
    user_email TEXT,
    user_password TEXT,
    pipeline_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be handled by Supabase Auth API
    -- This is a placeholder for documentation
    RAISE NOTICE 'Use Supabase Auth API to create user with role: ml_pipeline';
    RAISE NOTICE 'Email: %, Pipeline: %', user_email, pipeline_name;
    
    -- Return a placeholder UUID
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. AUDIT LOGGING
-- =====================================================

-- Create audit log table for tracking data access
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only researchers can view audit logs
CREATE POLICY "researchers_view_audit_logs" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (is_researcher());

-- Function to log data access
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        table_name,
        operation,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        TG_OP,
        COALESCE(NEW.patient_id, NEW.eye_id, NEW.image_id, NEW.measurement_id, NEW.run_id, OLD.patient_id, OLD.eye_id, OLD.image_id, OLD.measurement_id, OLD.run_id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to all main tables
CREATE TRIGGER audit_patients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_eyes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON eyes
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_fundus_images_trigger
    AFTER INSERT OR UPDATE OR DELETE ON fundus_images
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_refractive_measurements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON refractive_measurements
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION is_researcher() IS 'Check if authenticated user has researcher role';
COMMENT ON FUNCTION is_ml_pipeline() IS 'Check if authenticated user has ML pipeline role';
COMMENT ON FUNCTION has_read_access() IS 'Check if user can read medical research data';
COMMENT ON FUNCTION has_write_access() IS 'Check if user can modify medical research data';
COMMENT ON TABLE audit_logs IS 'Audit trail for all data access and modifications';
