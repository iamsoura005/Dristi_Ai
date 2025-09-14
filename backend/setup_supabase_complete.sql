-- =====================================================
-- Complete Supabase Medical Research Database Setup
-- Run this script in Supabase SQL Editor to set up everything
-- =====================================================

-- =====================================================
-- 1. ENABLE EXTENSIONS
-- =====================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for potential geographic features (optional)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- Patients table
CREATE TABLE IF NOT EXISTS patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    region TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eyes table
CREATE TABLE IF NOT EXISTS eyes (
    eye_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    axial_length FLOAT CHECK (axial_length > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, side)
);

-- Fundus images table
CREATE TABLE IF NOT EXISTS fundus_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eye_id UUID NOT NULL REFERENCES eyes(eye_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    capture_device TEXT,
    resolution TEXT,
    captured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refractive measurements table
CREATE TABLE IF NOT EXISTS refractive_measurements (
    measurement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eye_id UUID NOT NULL REFERENCES eyes(eye_id) ON DELETE CASCADE,
    sphere FLOAT NOT NULL,
    cylinder FLOAT NOT NULL,
    axis FLOAT CHECK (axis >= 0 AND axis <= 180),
    spherical_equivalent FLOAT GENERATED ALWAYS AS (sphere + (cylinder / 2.0)) STORED,
    measurement_method TEXT NOT NULL CHECK (measurement_method IN ('autorefraction', 'subjective')),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Model training logs table
CREATE TABLE IF NOT EXISTS model_training_logs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL,
    dataset_version TEXT NOT NULL,
    mae FLOAT CHECK (mae >= 0),
    rmse FLOAT CHECK (rmse >= 0),
    r2_score FLOAT CHECK (r2_score >= -1 AND r2_score <= 1),
    training_samples INTEGER CHECK (training_samples > 0),
    validation_samples INTEGER CHECK (validation_samples > 0),
    test_samples INTEGER CHECK (test_samples > 0),
    hyperparameters JSONB,
    training_duration_minutes INTEGER CHECK (training_duration_minutes > 0),
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
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

-- Storage audit logs table
CREATE TABLE IF NOT EXISTS storage_audit_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    bucket_id TEXT NOT NULL,
    object_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('UPLOAD', 'DOWNLOAD', 'DELETE', 'UPDATE')),
    file_size BIGINT,
    content_type TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_age ON patients(age);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_patients_region ON patients(region);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Eyes indexes
CREATE INDEX IF NOT EXISTS idx_eyes_patient_id ON eyes(patient_id);
CREATE INDEX IF NOT EXISTS idx_eyes_side ON eyes(side);
CREATE INDEX IF NOT EXISTS idx_eyes_axial_length ON eyes(axial_length);

-- Fundus images indexes
CREATE INDEX IF NOT EXISTS idx_fundus_images_eye_id ON fundus_images(eye_id);
CREATE INDEX IF NOT EXISTS idx_fundus_images_capture_device ON fundus_images(capture_device);
CREATE INDEX IF NOT EXISTS idx_fundus_images_captured_at ON fundus_images(captured_at);

-- Refractive measurements indexes
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_eye_id ON refractive_measurements(eye_id);
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_spherical_equivalent ON refractive_measurements(spherical_equivalent);
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_sphere ON refractive_measurements(sphere);
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_cylinder ON refractive_measurements(cylinder);
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_method ON refractive_measurements(measurement_method);
CREATE INDEX IF NOT EXISTS idx_refractive_measurements_measured_at ON refractive_measurements(measured_at);

-- Model training logs indexes
CREATE INDEX IF NOT EXISTS idx_model_training_logs_model_name ON model_training_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_model_training_logs_dataset_version ON model_training_logs(dataset_version);
CREATE INDEX IF NOT EXISTS idx_model_training_logs_mae ON model_training_logs(mae);
CREATE INDEX IF NOT EXISTS idx_model_training_logs_rmse ON model_training_logs(rmse);
CREATE INDEX IF NOT EXISTS idx_model_training_logs_trained_at ON model_training_logs(trained_at);

-- =====================================================
-- 4. CREATE VIEWS
-- =====================================================

-- ML training dataset view
CREATE OR REPLACE VIEW ml_training_dataset AS
SELECT 
    fi.image_id,
    fi.image_url,
    fi.capture_device,
    fi.resolution,
    fi.captured_at,
    rm.sphere,
    rm.cylinder,
    rm.axis,
    rm.spherical_equivalent,
    rm.measurement_method,
    rm.measured_at,
    e.side as eye_side,
    e.axial_length,
    p.age,
    p.gender,
    p.region,
    p.patient_id,
    e.eye_id,
    rm.measurement_id
FROM fundus_images fi
JOIN eyes e ON fi.eye_id = e.eye_id
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
JOIN patients p ON e.patient_id = p.patient_id
ORDER BY fi.created_at DESC;

-- Patient summary view
CREATE OR REPLACE VIEW patient_summary AS
SELECT 
    p.patient_id,
    p.age,
    p.gender,
    p.region,
    COUNT(DISTINCT e.eye_id) as total_eyes,
    COUNT(DISTINCT fi.image_id) as total_images,
    COUNT(DISTINCT rm.measurement_id) as total_measurements,
    MIN(rm.measured_at) as first_measurement,
    MAX(rm.measured_at) as latest_measurement,
    p.created_at
FROM patients p
LEFT JOIN eyes e ON p.patient_id = e.patient_id
LEFT JOIN fundus_images fi ON e.eye_id = fi.eye_id
LEFT JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
GROUP BY p.patient_id, p.age, p.gender, p.region, p.created_at
ORDER BY p.created_at DESC;

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Role checking functions
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

CREATE OR REPLACE FUNCTION has_read_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (is_researcher() OR is_ml_pipeline());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_write_access()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_researcher();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validation function
CREATE OR REPLACE FUNCTION validate_refractive_power()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sphere < -30 OR NEW.sphere > 30 THEN
        RAISE EXCEPTION 'Sphere value % is outside typical range (-30D to +30D)', NEW.sphere;
    END IF;
    
    IF NEW.cylinder > 0 OR NEW.cylinder < -10 THEN
        RAISE EXCEPTION 'Cylinder value % is outside typical range (0D to -10D)', NEW.cylinder;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit logging function
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

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE eyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundus_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE refractive_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_training_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Patients policies
DROP POLICY IF EXISTS "researchers_full_access_patients" ON patients;
CREATE POLICY "researchers_full_access_patients" ON patients
    FOR ALL TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

DROP POLICY IF EXISTS "ml_pipeline_read_patients" ON patients;
CREATE POLICY "ml_pipeline_read_patients" ON patients
    FOR SELECT TO authenticated
    USING (is_ml_pipeline());

-- Eyes policies
DROP POLICY IF EXISTS "researchers_full_access_eyes" ON eyes;
CREATE POLICY "researchers_full_access_eyes" ON eyes
    FOR ALL TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

DROP POLICY IF EXISTS "ml_pipeline_read_eyes" ON eyes;
CREATE POLICY "ml_pipeline_read_eyes" ON eyes
    FOR SELECT TO authenticated
    USING (is_ml_pipeline());

-- Fundus images policies
DROP POLICY IF EXISTS "researchers_full_access_fundus_images" ON fundus_images;
CREATE POLICY "researchers_full_access_fundus_images" ON fundus_images
    FOR ALL TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

DROP POLICY IF EXISTS "ml_pipeline_read_fundus_images" ON fundus_images;
CREATE POLICY "ml_pipeline_read_fundus_images" ON fundus_images
    FOR SELECT TO authenticated
    USING (is_ml_pipeline());

-- Refractive measurements policies
DROP POLICY IF EXISTS "researchers_full_access_refractive_measurements" ON refractive_measurements;
CREATE POLICY "researchers_full_access_refractive_measurements" ON refractive_measurements
    FOR ALL TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

DROP POLICY IF EXISTS "ml_pipeline_read_refractive_measurements" ON refractive_measurements;
CREATE POLICY "ml_pipeline_read_refractive_measurements" ON refractive_measurements
    FOR SELECT TO authenticated
    USING (is_ml_pipeline());

-- Model training logs policies
DROP POLICY IF EXISTS "researchers_full_access_model_training_logs" ON model_training_logs;
CREATE POLICY "researchers_full_access_model_training_logs" ON model_training_logs
    FOR ALL TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

DROP POLICY IF EXISTS "ml_pipeline_read_model_training_logs" ON model_training_logs;
CREATE POLICY "ml_pipeline_read_model_training_logs" ON model_training_logs
    FOR SELECT TO authenticated
    USING (is_ml_pipeline());

-- Audit logs policies
DROP POLICY IF EXISTS "researchers_view_audit_logs" ON audit_logs;
CREATE POLICY "researchers_view_audit_logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (is_researcher());

DROP POLICY IF EXISTS "researchers_view_storage_audit_logs" ON storage_audit_logs;
CREATE POLICY "researchers_view_storage_audit_logs" ON storage_audit_logs
    FOR SELECT TO authenticated
    USING (is_researcher());

-- =====================================================
-- 8. CREATE TRIGGERS
-- =====================================================

-- Validation trigger
DROP TRIGGER IF EXISTS validate_refractive_power_trigger ON refractive_measurements;
CREATE TRIGGER validate_refractive_power_trigger
    BEFORE INSERT OR UPDATE ON refractive_measurements
    FOR EACH ROW EXECUTE FUNCTION validate_refractive_power();

-- Audit triggers
DROP TRIGGER IF EXISTS audit_patients_trigger ON patients;
CREATE TRIGGER audit_patients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON patients
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

DROP TRIGGER IF EXISTS audit_eyes_trigger ON eyes;
CREATE TRIGGER audit_eyes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON eyes
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

DROP TRIGGER IF EXISTS audit_fundus_images_trigger ON fundus_images;
CREATE TRIGGER audit_fundus_images_trigger
    AFTER INSERT OR UPDATE OR DELETE ON fundus_images
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

DROP TRIGGER IF EXISTS audit_refractive_measurements_trigger ON refractive_measurements;
CREATE TRIGGER audit_refractive_measurements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON refractive_measurements
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- =====================================================
-- 9. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE patients IS 'Anonymized patient demographics for medical research';
COMMENT ON TABLE eyes IS 'Individual eye records linked to patients';
COMMENT ON TABLE fundus_images IS 'Fundus photographs stored in Supabase Storage';
COMMENT ON TABLE refractive_measurements IS 'Refractive power measurements for ML training';
COMMENT ON TABLE model_training_logs IS 'ML model training performance tracking';

COMMENT ON COLUMN refractive_measurements.spherical_equivalent IS 'Calculated as sphere + (cylinder/2), primary target for ML prediction';

-- =====================================================
-- 10. VERIFICATION
-- =====================================================

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs')
ORDER BY tablename;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs')
ORDER BY tablename;

-- Success message
SELECT 'Supabase Medical Research Database setup completed successfully!' as status;
