-- =====================================================
-- Supabase Seed Data for Medical Research Database
-- Sample data for testing ML pipeline and research workflows
-- =====================================================

-- =====================================================
-- 1. SEED PATIENTS DATA
-- =====================================================

-- Insert sample patients with diverse demographics
INSERT INTO patients (patient_id, age, gender, region) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 25, 'male', 'India'),
    ('550e8400-e29b-41d4-a716-446655440002', 34, 'female', 'India'),
    ('550e8400-e29b-41d4-a716-446655440003', 42, 'male', 'USA'),
    ('550e8400-e29b-41d4-a716-446655440004', 28, 'female', 'Europe'),
    ('550e8400-e29b-41d4-a716-446655440005', 56, 'other', 'India'),
    ('550e8400-e29b-41d4-a716-446655440006', 19, 'female', 'Asia'),
    ('550e8400-e29b-41d4-a716-446655440007', 67, 'male', 'Europe'),
    ('550e8400-e29b-41d4-a716-446655440008', 31, 'female', 'USA');

-- =====================================================
-- 2. SEED EYES DATA
-- =====================================================

-- Insert eyes for each patient (both left and right)
INSERT INTO eyes (eye_id, patient_id, side, axial_length, notes) VALUES
    -- Patient 1 (25-year-old male from India)
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'right', 24.2, 'Normal axial length'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'left', 24.1, 'Normal axial length'),
    
    -- Patient 2 (34-year-old female from India)
    ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'right', 25.8, 'Elongated axial length - myopic'),
    ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'left', 25.9, 'Elongated axial length - myopic'),
    
    -- Patient 3 (42-year-old male from USA)
    ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'right', 22.8, 'Short axial length - hyperopic'),
    ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'left', 22.9, 'Short axial length - hyperopic'),
    
    -- Patient 4 (28-year-old female from Europe)
    ('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', 'right', 24.5, 'Normal with slight astigmatism'),
    ('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', 'left', 24.4, 'Normal with slight astigmatism'),
    
    -- Patient 5 (56-year-old from India)
    ('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440005', 'right', 23.1, 'Age-related changes'),
    ('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'left', 23.2, 'Age-related changes'),
    
    -- Patient 6 (19-year-old female from Asia)
    ('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440006', 'right', 26.2, 'High myopia'),
    ('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440006', 'left', 26.1, 'High myopia'),
    
    -- Patient 7 (67-year-old male from Europe)
    ('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440007', 'right', 23.8, 'Presbyopic changes'),
    ('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440007', 'left', 23.7, 'Presbyopic changes'),
    
    -- Patient 8 (31-year-old female from USA)
    ('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440008', 'right', 24.0, 'Normal vision'),
    ('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440008', 'left', 24.1, 'Normal vision');

-- =====================================================
-- 3. SEED FUNDUS IMAGES DATA
-- =====================================================

-- Insert sample fundus images (2 per patient as specified)
INSERT INTO fundus_images (image_id, eye_id, image_url, capture_device, resolution, captured_at) VALUES
    -- Patient 1 images
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440001/2024-01-15T10-30-00.jpg', 
     'Topcon TRC-50DX', '3000x2000', '2024-01-15 10:30:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440001/660e8400-e29b-41d4-a716-446655440002/2024-01-15T10-35-00.jpg', 
     'Topcon TRC-50DX', '3000x2000', '2024-01-15 10:35:00+00'),
    
    -- Patient 2 images (myopic)
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440002/660e8400-e29b-41d4-a716-446655440003/2024-01-16T14-20-00.jpg', 
     'Optos Daytona', '4000x3000', '2024-01-16 14:20:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440002/660e8400-e29b-41d4-a716-446655440004/2024-01-16T14-25-00.jpg', 
     'Optos Daytona', '4000x3000', '2024-01-16 14:25:00+00'),
    
    -- Patient 3 images (hyperopic)
    ('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440003/660e8400-e29b-41d4-a716-446655440005/2024-01-17T09-15-00.jpg', 
     'Canon CR-2 Plus AF', '2592x1944', '2024-01-17 09:15:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440003/660e8400-e29b-41d4-a716-446655440006/2024-01-17T09-20-00.jpg', 
     'Canon CR-2 Plus AF', '2592x1944', '2024-01-17 09:20:00+00'),
    
    -- Patient 4 images (astigmatism)
    ('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440004/660e8400-e29b-41d4-a716-446655440007/2024-01-18T11-45-00.jpg', 
     'Zeiss Visucam 500', '2048x1536', '2024-01-18 11:45:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440004/660e8400-e29b-41d4-a716-446655440008/2024-01-18T11-50-00.jpg', 
     'Zeiss Visucam 500', '2048x1536', '2024-01-18 11:50:00+00'),
    
    -- Patient 5 images (age-related)
    ('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440009', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440005/660e8400-e29b-41d4-a716-446655440009/2024-01-19T16-10-00.jpg', 
     'Topcon TRC-50DX', '3000x2000', '2024-01-19 16:10:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440010', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440005/660e8400-e29b-41d4-a716-446655440010/2024-01-19T16-15-00.jpg', 
     'Topcon TRC-50DX', '3000x2000', '2024-01-19 16:15:00+00'),
    
    -- Patient 6 images (high myopia)
    ('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440006/660e8400-e29b-41d4-a716-446655440011/2024-01-20T13-30-00.jpg', 
     'Optos Daytona', '4000x3000', '2024-01-20 13:30:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440006/660e8400-e29b-41d4-a716-446655440012/2024-01-20T13-35-00.jpg', 
     'Optos Daytona', '4000x3000', '2024-01-20 13:35:00+00'),
    
    -- Patient 7 images (presbyopic)
    ('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440007/660e8400-e29b-41d4-a716-446655440013/2024-01-21T08-45-00.jpg', 
     'Canon CR-2 Plus AF', '2592x1944', '2024-01-21 08:45:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440007/660e8400-e29b-41d4-a716-446655440014/2024-01-21T08-50-00.jpg', 
     'Canon CR-2 Plus AF', '2592x1944', '2024-01-21 08:50:00+00'),
    
    -- Patient 8 images (normal)
    ('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440015', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440008/660e8400-e29b-41d4-a716-446655440015/2024-01-22T12-00-00.jpg', 
     'Zeiss Visucam 500', '2048x1536', '2024-01-22 12:00:00+00'),
    
    ('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440016', 
     'fundus-images/550e8400-e29b-41d4-a716-446655440008/660e8400-e29b-41d4-a716-446655440016/2024-01-22T12-05-00.jpg', 
     'Zeiss Visucam 500', '2048x1536', '2024-01-22 12:05:00+00');

-- =====================================================
-- 4. SEED REFRACTIVE MEASUREMENTS DATA
-- =====================================================

-- Insert refractive measurements corresponding to the clinical scenarios
INSERT INTO refractive_measurements (measurement_id, eye_id, sphere, cylinder, axis, measurement_method, measured_at) VALUES
    -- Patient 1 (Normal vision)
    ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 0.25, -0.50, 90, 'subjective', '2024-01-15 10:45:00+00'),
    ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 0.00, -0.25, 180, 'subjective', '2024-01-15 10:50:00+00'),
    
    -- Patient 2 (Myopic)
    ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', -4.50, -1.00, 85, 'autorefraction', '2024-01-16 14:40:00+00'),
    ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', -4.75, -0.75, 95, 'autorefraction', '2024-01-16 14:45:00+00'),
    
    -- Patient 3 (Hyperopic)
    ('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 2.25, -0.50, 45, 'subjective', '2024-01-17 09:35:00+00'),
    ('880e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 2.00, -0.75, 135, 'subjective', '2024-01-17 09:40:00+00'),
    
    -- Patient 4 (Astigmatism)
    ('880e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', -0.25, -2.50, 15, 'subjective', '2024-01-18 12:05:00+00'),
    ('880e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', -0.50, -2.25, 165, 'subjective', '2024-01-18 12:10:00+00'),
    
    -- Patient 5 (Age-related presbyopia)
    ('880e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440009', 1.00, -0.50, 90, 'subjective', '2024-01-19 16:30:00+00'),
    ('880e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440010', 1.25, -0.25, 180, 'subjective', '2024-01-19 16:35:00+00'),
    
    -- Patient 6 (High myopia)
    ('880e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440011', -8.50, -1.50, 70, 'autorefraction', '2024-01-20 13:50:00+00'),
    ('880e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440012', -8.25, -1.25, 110, 'autorefraction', '2024-01-20 13:55:00+00'),
    
    -- Patient 7 (Presbyopic with mild hyperopia)
    ('880e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440013', 1.50, -0.75, 30, 'subjective', '2024-01-21 09:05:00+00'),
    ('880e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440014', 1.75, -0.50, 150, 'subjective', '2024-01-21 09:10:00+00'),
    
    -- Patient 8 (Normal vision)
    ('880e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440015', 0.00, 0.00, 0, 'subjective', '2024-01-22 12:20:00+00'),
    ('880e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440016', -0.25, 0.00, 0, 'subjective', '2024-01-22 12:25:00+00');

-- =====================================================
-- 5. SEED MODEL TRAINING LOGS DATA
-- =====================================================

-- Insert sample model training logs
INSERT INTO model_training_logs (
    run_id, model_name, dataset_version, mae, rmse, r2_score, 
    training_samples, validation_samples, test_samples, 
    hyperparameters, training_duration_minutes
) VALUES
    ('990e8400-e29b-41d4-a716-446655440001', 'ResNet50', 'v1.0', 0.56, 0.78, 0.82, 
     1200, 300, 150, 
     '{"learning_rate": 0.001, "batch_size": 32, "epochs": 100, "dropout": 0.5, "optimizer": "Adam"}', 
     180),
    
    ('990e8400-e29b-41d4-a716-446655440002', 'EfficientNet-B0', 'v1.0', 0.48, 0.65, 0.87, 
     1200, 300, 150, 
     '{"learning_rate": 0.0005, "batch_size": 16, "epochs": 150, "dropout": 0.3, "optimizer": "AdamW"}', 
     240),
    
    ('990e8400-e29b-41d4-a716-446655440003', 'VisionTransformer', 'v1.1', 0.42, 0.58, 0.91, 
     1500, 375, 188, 
     '{"learning_rate": 0.0001, "batch_size": 8, "epochs": 200, "patch_size": 16, "num_heads": 12}', 
     420),
    
    ('990e8400-e29b-41d4-a716-446655440004', 'DenseNet121', 'v1.1', 0.52, 0.71, 0.85, 
     1500, 375, 188, 
     '{"learning_rate": 0.002, "batch_size": 24, "epochs": 120, "growth_rate": 32, "dropout": 0.4}', 
     200),
    
    ('990e8400-e29b-41d4-a716-446655440005', 'ResNet50_Ensemble', 'v2.0', 0.38, 0.52, 0.93, 
     2000, 500, 250, 
     '{"models": 5, "learning_rate": 0.001, "batch_size": 32, "epochs": 80, "ensemble_method": "voting"}', 
     600);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Display summary of seeded data
SELECT 'Patients' as table_name, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'Eyes', COUNT(*) FROM eyes
UNION ALL
SELECT 'Fundus Images', COUNT(*) FROM fundus_images
UNION ALL
SELECT 'Refractive Measurements', COUNT(*) FROM refractive_measurements
UNION ALL
SELECT 'Model Training Logs', COUNT(*) FROM model_training_logs;

-- Display sample from ML training dataset view
SELECT 
    p.age,
    p.gender,
    p.region,
    e.side,
    e.axial_length,
    rm.spherical_equivalent,
    fi.capture_device,
    fi.resolution
FROM patients p
JOIN eyes e ON p.patient_id = e.patient_id
JOIN fundus_images fi ON e.eye_id = fi.eye_id
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
ORDER BY p.age
LIMIT 5;
