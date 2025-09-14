-- =====================================================
-- Supabase Medical Research Database Schema
-- For Refractive Power Prediction from Fundus Images
-- =====================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PATIENTS TABLE
-- =====================================================
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    region TEXT NOT NULL, -- e.g., "India", "USA", "Europe"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_patients_age ON patients(age);
CREATE INDEX idx_patients_gender ON patients(gender);
CREATE INDEX idx_patients_region ON patients(region);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- =====================================================
-- 2. EYES TABLE
-- =====================================================
CREATE TABLE eyes (
    eye_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    axial_length FLOAT CHECK (axial_length > 0), -- in mm, optional
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per patient per eye side
    UNIQUE(patient_id, side)
);

-- Add indexes
CREATE INDEX idx_eyes_patient_id ON eyes(patient_id);
CREATE INDEX idx_eyes_side ON eyes(side);
CREATE INDEX idx_eyes_axial_length ON eyes(axial_length);

-- =====================================================
-- 3. FUNDUS IMAGES TABLE
-- =====================================================
CREATE TABLE fundus_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eye_id UUID NOT NULL REFERENCES eyes(eye_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Supabase Storage URL
    capture_device TEXT, -- e.g., "Topcon TRC-50DX", "Optos Daytona"
    resolution TEXT, -- e.g., "3000x2000", "4000x3000"
    captured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_fundus_images_eye_id ON fundus_images(eye_id);
CREATE INDEX idx_fundus_images_capture_device ON fundus_images(capture_device);
CREATE INDEX idx_fundus_images_captured_at ON fundus_images(captured_at);

-- =====================================================
-- 4. REFRACTIVE MEASUREMENTS TABLE
-- =====================================================
CREATE TABLE refractive_measurements (
    measurement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eye_id UUID NOT NULL REFERENCES eyes(eye_id) ON DELETE CASCADE,
    sphere FLOAT NOT NULL, -- Spherical power in diopters (D)
    cylinder FLOAT NOT NULL, -- Cylindrical power in diopters (D)
    axis FLOAT CHECK (axis >= 0 AND axis <= 180), -- Axis in degrees
    spherical_equivalent FLOAT GENERATED ALWAYS AS (sphere + (cylinder / 2.0)) STORED,
    measurement_method TEXT NOT NULL CHECK (measurement_method IN ('autorefraction', 'subjective')),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for ML training queries
CREATE INDEX idx_refractive_measurements_eye_id ON refractive_measurements(eye_id);
CREATE INDEX idx_refractive_measurements_spherical_equivalent ON refractive_measurements(spherical_equivalent);
CREATE INDEX idx_refractive_measurements_sphere ON refractive_measurements(sphere);
CREATE INDEX idx_refractive_measurements_cylinder ON refractive_measurements(cylinder);
CREATE INDEX idx_refractive_measurements_method ON refractive_measurements(measurement_method);
CREATE INDEX idx_refractive_measurements_measured_at ON refractive_measurements(measured_at);

-- =====================================================
-- 5. MODEL TRAINING LOGS TABLE
-- =====================================================
CREATE TABLE model_training_logs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL, -- e.g., "ResNet50", "EfficientNet-B0"
    dataset_version TEXT NOT NULL, -- e.g., "v1.0", "2024-01-15"
    mae FLOAT CHECK (mae >= 0), -- Mean Absolute Error in diopters
    rmse FLOAT CHECK (rmse >= 0), -- Root Mean Squared Error in diopters
    r2_score FLOAT CHECK (r2_score >= -1 AND r2_score <= 1), -- R-squared score
    training_samples INTEGER CHECK (training_samples > 0),
    validation_samples INTEGER CHECK (validation_samples > 0),
    test_samples INTEGER CHECK (test_samples > 0),
    hyperparameters JSONB, -- Store model hyperparameters
    training_duration_minutes INTEGER CHECK (training_duration_minutes > 0),
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for model performance tracking
CREATE INDEX idx_model_training_logs_model_name ON model_training_logs(model_name);
CREATE INDEX idx_model_training_logs_dataset_version ON model_training_logs(dataset_version);
CREATE INDEX idx_model_training_logs_mae ON model_training_logs(mae);
CREATE INDEX idx_model_training_logs_rmse ON model_training_logs(rmse);
CREATE INDEX idx_model_training_logs_trained_at ON model_training_logs(trained_at);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for ML training dataset
CREATE VIEW ml_training_dataset AS
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

-- View for patient summary
CREATE VIEW patient_summary AS
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
-- FUNCTIONS FOR DATA VALIDATION
-- =====================================================

-- Function to validate refractive power ranges
CREATE OR REPLACE FUNCTION validate_refractive_power()
RETURNS TRIGGER AS $$
BEGIN
    -- Check sphere range (-30D to +30D is typical)
    IF NEW.sphere < -30 OR NEW.sphere > 30 THEN
        RAISE EXCEPTION 'Sphere value % is outside typical range (-30D to +30D)', NEW.sphere;
    END IF;
    
    -- Check cylinder range (0D to -10D is typical)
    IF NEW.cylinder > 0 OR NEW.cylinder < -10 THEN
        RAISE EXCEPTION 'Cylinder value % is outside typical range (0D to -10D)', NEW.cylinder;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger
CREATE TRIGGER validate_refractive_power_trigger
    BEFORE INSERT OR UPDATE ON refractive_measurements
    FOR EACH ROW EXECUTE FUNCTION validate_refractive_power();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE patients IS 'Anonymized patient demographics for medical research';
COMMENT ON TABLE eyes IS 'Individual eye records linked to patients';
COMMENT ON TABLE fundus_images IS 'Fundus photographs stored in Supabase Storage';
COMMENT ON TABLE refractive_measurements IS 'Refractive power measurements for ML training';
COMMENT ON TABLE model_training_logs IS 'ML model training performance tracking';

COMMENT ON COLUMN patients.patient_id IS 'Anonymous UUID identifier for patient';
COMMENT ON COLUMN patients.age IS 'Patient age in years at time of data collection';
COMMENT ON COLUMN patients.region IS 'Geographic region for population studies';

COMMENT ON COLUMN refractive_measurements.spherical_equivalent IS 'Calculated as sphere + (cylinder/2), primary target for ML prediction';
COMMENT ON COLUMN refractive_measurements.sphere IS 'Spherical power in diopters (positive for hyperopia, negative for myopia)';
COMMENT ON COLUMN refractive_measurements.cylinder IS 'Cylindrical power in diopters (typically negative for astigmatism correction)';
COMMENT ON COLUMN refractive_measurements.axis IS 'Axis of astigmatism correction in degrees (0-180)';

COMMENT ON VIEW ml_training_dataset IS 'Complete dataset view for ML model training with all relevant features';
COMMENT ON VIEW patient_summary IS 'Summary statistics per patient for data quality assessment';
