-- =====================================================
-- Supabase Medical Research Database - Example Queries
-- Comprehensive SQL examples for ML training and research
-- =====================================================

-- =====================================================
-- 1. ML TRAINING DATASET QUERIES
-- =====================================================

-- Fetch complete dataset for ML training
SELECT 
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
    p.region
FROM fundus_images fi
JOIN eyes e ON fi.eye_id = e.eye_id
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
JOIN patients p ON e.patient_id = p.patient_id
WHERE rm.measurement_method = 'subjective'  -- Use only subjective measurements
ORDER BY fi.created_at DESC;

-- Fetch dataset with specific refractive power range (myopia focus)
SELECT 
    fi.image_url,
    rm.spherical_equivalent,
    p.age,
    p.gender,
    e.axial_length
FROM fundus_images fi
JOIN eyes e ON fi.eye_id = e.eye_id
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
JOIN patients p ON e.patient_id = p.patient_id
WHERE rm.spherical_equivalent BETWEEN -10.0 AND -0.5  -- Myopia range
AND e.axial_length IS NOT NULL
ORDER BY rm.spherical_equivalent;

-- Fetch balanced dataset by gender and age groups
WITH age_groups AS (
    SELECT 
        fi.image_url,
        rm.spherical_equivalent,
        p.gender,
        CASE 
            WHEN p.age < 20 THEN 'Under 20'
            WHEN p.age BETWEEN 20 AND 40 THEN '20-40'
            WHEN p.age BETWEEN 41 AND 60 THEN '41-60'
            ELSE 'Over 60'
        END as age_group,
        ROW_NUMBER() OVER (
            PARTITION BY p.gender, 
            CASE 
                WHEN p.age < 20 THEN 'Under 20'
                WHEN p.age BETWEEN 20 AND 40 THEN '20-40'
                WHEN p.age BETWEEN 41 AND 60 THEN '41-60'
                ELSE 'Over 60'
            END 
            ORDER BY RANDOM()
        ) as rn
    FROM fundus_images fi
    JOIN eyes e ON fi.eye_id = e.eye_id
    JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
    JOIN patients p ON e.patient_id = p.patient_id
)
SELECT image_url, spherical_equivalent, gender, age_group
FROM age_groups
WHERE rn <= 50  -- Limit to 50 samples per group
ORDER BY gender, age_group;

-- =====================================================
-- 2. DATA INSERTION EXAMPLES
-- =====================================================

-- Insert a new patient with eyes and measurements
WITH new_patient AS (
    INSERT INTO patients (age, gender, region)
    VALUES (28, 'female', 'India')
    RETURNING patient_id
),
new_eyes AS (
    INSERT INTO eyes (patient_id, side, axial_length, notes)
    SELECT 
        np.patient_id,
        unnest(ARRAY['left', 'right']),
        unnest(ARRAY[24.5, 24.3]),
        unnest(ARRAY['Normal eye', 'Normal eye'])
    FROM new_patient np
    RETURNING eye_id, patient_id, side
)
INSERT INTO fundus_images (eye_id, image_url, capture_device, resolution, captured_at)
SELECT 
    ne.eye_id,
    'fundus-images/' || ne.patient_id || '/' || ne.eye_id || '/2024-01-23T14-30-00.jpg',
    'Topcon TRC-50DX',
    '3000x2000',
    '2024-01-23 14:30:00+00'
FROM new_eyes ne;

-- Insert refractive measurements for existing eyes
INSERT INTO refractive_measurements (eye_id, sphere, cylinder, axis, measurement_method, measured_at)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', -2.50, -0.75, 90, 'subjective', NOW()),
    ('660e8400-e29b-41d4-a716-446655440002', -2.25, -0.50, 85, 'subjective', NOW());

-- =====================================================
-- 3. DATA ANALYSIS QUERIES
-- =====================================================

-- Distribution of refractive errors by age group
SELECT 
    CASE 
        WHEN p.age < 20 THEN 'Under 20'
        WHEN p.age BETWEEN 20 AND 40 THEN '20-40'
        WHEN p.age BETWEEN 41 AND 60 THEN '41-60'
        ELSE 'Over 60'
    END as age_group,
    COUNT(*) as total_measurements,
    AVG(rm.spherical_equivalent) as avg_spherical_equivalent,
    STDDEV(rm.spherical_equivalent) as std_spherical_equivalent,
    MIN(rm.spherical_equivalent) as min_spherical_equivalent,
    MAX(rm.spherical_equivalent) as max_spherical_equivalent,
    COUNT(CASE WHEN rm.spherical_equivalent < -0.5 THEN 1 END) as myopic_count,
    COUNT(CASE WHEN rm.spherical_equivalent > 0.5 THEN 1 END) as hyperopic_count
FROM refractive_measurements rm
JOIN eyes e ON rm.eye_id = e.eye_id
JOIN patients p ON e.patient_id = p.patient_id
GROUP BY age_group
ORDER BY age_group;

-- Correlation between axial length and spherical equivalent
SELECT 
    e.axial_length,
    rm.spherical_equivalent,
    p.age,
    p.gender
FROM eyes e
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
JOIN patients p ON e.patient_id = p.patient_id
WHERE e.axial_length IS NOT NULL
ORDER BY e.axial_length;

-- Image quality distribution by capture device
SELECT 
    fi.capture_device,
    fi.resolution,
    COUNT(*) as image_count,
    AVG(CAST(SPLIT_PART(fi.resolution, 'x', 1) AS INTEGER) * 
        CAST(SPLIT_PART(fi.resolution, 'x', 2) AS INTEGER)) as avg_pixel_count
FROM fundus_images fi
WHERE fi.resolution IS NOT NULL
GROUP BY fi.capture_device, fi.resolution
ORDER BY fi.capture_device, avg_pixel_count DESC;

-- =====================================================
-- 4. MODEL PERFORMANCE TRACKING
-- =====================================================

-- Compare model performance over time
SELECT 
    model_name,
    dataset_version,
    mae,
    rmse,
    r2_score,
    training_samples,
    trained_at,
    LAG(mae) OVER (PARTITION BY model_name ORDER BY trained_at) as previous_mae,
    mae - LAG(mae) OVER (PARTITION BY model_name ORDER BY trained_at) as mae_improvement
FROM model_training_logs
ORDER BY model_name, trained_at;

-- Best performing models by metric
SELECT 
    model_name,
    dataset_version,
    mae,
    rmse,
    r2_score,
    training_duration_minutes,
    trained_at,
    RANK() OVER (ORDER BY mae ASC) as mae_rank,
    RANK() OVER (ORDER BY rmse ASC) as rmse_rank,
    RANK() OVER (ORDER BY r2_score DESC) as r2_rank
FROM model_training_logs
WHERE mae IS NOT NULL AND rmse IS NOT NULL AND r2_score IS NOT NULL
ORDER BY mae ASC;

-- =====================================================
-- 5. DATA QUALITY CHECKS
-- =====================================================

-- Check for missing data
SELECT 
    'Patients without eyes' as issue,
    COUNT(*) as count
FROM patients p
LEFT JOIN eyes e ON p.patient_id = e.patient_id
WHERE e.patient_id IS NULL

UNION ALL

SELECT 
    'Eyes without images' as issue,
    COUNT(*) as count
FROM eyes e
LEFT JOIN fundus_images fi ON e.eye_id = fi.eye_id
WHERE fi.eye_id IS NULL

UNION ALL

SELECT 
    'Eyes without measurements' as issue,
    COUNT(*) as count
FROM eyes e
LEFT JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
WHERE rm.eye_id IS NULL

UNION ALL

SELECT 
    'Images without measurements' as issue,
    COUNT(*) as count
FROM fundus_images fi
LEFT JOIN refractive_measurements rm ON fi.eye_id = rm.eye_id
WHERE rm.eye_id IS NULL;

-- Validate refractive power ranges
SELECT 
    measurement_id,
    sphere,
    cylinder,
    axis,
    spherical_equivalent,
    CASE 
        WHEN sphere < -30 OR sphere > 30 THEN 'Sphere out of range'
        WHEN cylinder > 0 OR cylinder < -10 THEN 'Cylinder out of range'
        WHEN axis < 0 OR axis > 180 THEN 'Axis out of range'
        ELSE 'Valid'
    END as validation_status
FROM refractive_measurements
WHERE sphere < -30 OR sphere > 30 
   OR cylinder > 0 OR cylinder < -10 
   OR axis < 0 OR axis > 180;

-- =====================================================
-- 6. EXPORT QUERIES FOR ML PIPELINES
-- =====================================================

-- Export training set (80% of data)
WITH numbered_data AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn,
        COUNT(*) OVER () as total_count
    FROM ml_training_dataset
)
SELECT 
    image_url,
    spherical_equivalent,
    age,
    gender,
    eye_side,
    axial_length,
    capture_device
FROM numbered_data
WHERE rn <= (total_count * 0.8);

-- Export validation set (10% of data)
WITH numbered_data AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn,
        COUNT(*) OVER () as total_count
    FROM ml_training_dataset
)
SELECT 
    image_url,
    spherical_equivalent,
    age,
    gender,
    eye_side,
    axial_length,
    capture_device
FROM numbered_data
WHERE rn > (total_count * 0.8) AND rn <= (total_count * 0.9);

-- Export test set (10% of data)
WITH numbered_data AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn,
        COUNT(*) OVER () as total_count
    FROM ml_training_dataset
)
SELECT 
    image_url,
    spherical_equivalent,
    age,
    gender,
    eye_side,
    axial_length,
    capture_device
FROM numbered_data
WHERE rn > (total_count * 0.9);

-- =====================================================
-- 7. MONITORING AND MAINTENANCE
-- =====================================================

-- Database growth over time
SELECT 
    DATE(created_at) as date,
    COUNT(*) as new_patients
FROM patients
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Storage usage by patient
SELECT 
    p.patient_id,
    p.age,
    p.gender,
    p.region,
    COUNT(fi.image_id) as image_count,
    STRING_AGG(DISTINCT fi.capture_device, ', ') as devices_used
FROM patients p
JOIN eyes e ON p.patient_id = e.patient_id
JOIN fundus_images fi ON e.eye_id = fi.eye_id
GROUP BY p.patient_id, p.age, p.gender, p.region
HAVING COUNT(fi.image_id) > 5  -- Patients with more than 5 images
ORDER BY image_count DESC;

-- Recent activity summary
SELECT
    'New patients today' as metric,
    COUNT(*) as value
FROM patients
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT
    'New images today' as metric,
    COUNT(*) as value
FROM fundus_images
WHERE DATE(created_at) = CURRENT_DATE

UNION ALL

SELECT
    'New measurements today' as metric,
    COUNT(*) as value
FROM refractive_measurements
WHERE DATE(created_at) = CURRENT_DATE;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

/*
USAGE NOTES:

1. ML Training Queries:
   - Use the ml_training_dataset view for complete datasets
   - Filter by measurement_method = 'subjective' for higher accuracy
   - Consider age and gender balance for robust models

2. Data Insertion:
   - Always create patients first, then eyes, then images/measurements
   - Use transactions for multi-table inserts
   - Validate refractive power ranges before insertion

3. Performance Optimization:
   - Use indexes on frequently queried columns
   - Limit large dataset queries with LIMIT and OFFSET
   - Use EXPLAIN ANALYZE to optimize complex queries

4. Data Quality:
   - Run validation queries regularly
   - Check for orphaned records
   - Monitor data distribution for bias

5. Security:
   - All queries respect RLS policies
   - Use appropriate user roles (researcher/ml_pipeline)
   - Audit logs track all data access
*/
