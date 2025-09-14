# Supabase Medical Research Backend Documentation

## 🎯 Project Overview

This Supabase backend is designed for a medical research project that predicts refractive power (diopters) from fundus images using machine learning. The system stores fundus images and clinical metadata in Supabase, enabling ML pipelines to fetch data for training and evaluation while providing researchers with secure access to upload and view data.

## 📊 Database Schema

### Core Tables

#### 1. `patients`
Anonymized patient demographics for medical research.

```sql
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    age INTEGER NOT NULL CHECK (age >= 0 AND age <= 150),
    gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    region TEXT NOT NULL, -- e.g., "India", "USA", "Europe"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `eyes`
Individual eye records linked to patients.

```sql
CREATE TABLE eyes (
    eye_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('left', 'right')),
    axial_length FLOAT CHECK (axial_length > 0), -- in mm, optional
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, side)
);
```

#### 3. `fundus_images`
Fundus photographs stored in Supabase Storage.

```sql
CREATE TABLE fundus_images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eye_id UUID NOT NULL REFERENCES eyes(eye_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL, -- Supabase Storage URL
    capture_device TEXT, -- e.g., "Topcon TRC-50DX", "Optos Daytona"
    resolution TEXT, -- e.g., "3000x2000", "4000x3000"
    captured_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `refractive_measurements`
Refractive power measurements for ML training.

```sql
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
```

#### 5. `model_training_logs`
ML model training performance tracking.

```sql
CREATE TABLE model_training_logs (
    run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name TEXT NOT NULL, -- e.g., "ResNet50", "EfficientNet-B0"
    dataset_version TEXT NOT NULL, -- e.g., "v1.0", "2024-01-15"
    mae FLOAT CHECK (mae >= 0), -- Mean Absolute Error in diopters
    rmse FLOAT CHECK (rmse >= 0), -- Root Mean Squared Error in diopters
    r2_score FLOAT CHECK (r2_score >= -1 AND r2_score <= 1),
    training_samples INTEGER CHECK (training_samples > 0),
    validation_samples INTEGER CHECK (validation_samples > 0),
    test_samples INTEGER CHECK (test_samples > 0),
    hyperparameters JSONB,
    training_duration_minutes INTEGER CHECK (training_duration_minutes > 0),
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Authentication & Security

### User Roles

1. **Researcher** (`researcher`)
   - Full access: INSERT, SELECT, UPDATE on all tables
   - Can upload and manage fundus images
   - Can view audit logs

2. **ML Pipeline** (`ml_pipeline`)
   - Read-only access: SELECT only on all tables
   - Can download images for training
   - Cannot modify data

### Row-Level Security (RLS)

All tables have RLS enabled with policies based on user roles:

```sql
-- Example policy for researchers
CREATE POLICY "researchers_full_access_patients" ON patients
    FOR ALL
    TO authenticated
    USING (is_researcher())
    WITH CHECK (is_researcher());

-- Example policy for ML pipeline
CREATE POLICY "ml_pipeline_read_patients" ON patients
    FOR SELECT
    TO authenticated
    USING (is_ml_pipeline());
```

## 📁 Storage Configuration

### Fundus Images Bucket

- **Bucket Name**: `fundus-images`
- **Structure**: `{patient_id}/{eye_id}/{timestamp}.{extension}`
- **File Types**: JPEG, PNG, TIFF
- **Size Limit**: 50MB per file
- **Access**: Authenticated users with proper roles

### Storage Policies

```sql
-- Researchers can upload
CREATE POLICY "researchers_can_upload_fundus_images" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'fundus-images' AND is_researcher());

-- Authenticated users can view
CREATE POLICY "authenticated_can_view_fundus_images" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'fundus-images' AND has_read_access());
```

## 🔧 Setup Instructions

### 1. Environment Variables

Create a `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Configuration
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Note down URL and keys
   ```

2. **Run Schema Migration**
   ```sql
   -- Execute in Supabase SQL Editor
   \i backend/supabase_schema.sql
   \i backend/supabase_auth_rls.sql
   \i backend/supabase_storage_config.sql
   ```

3. **Create Storage Bucket**
   ```sql
   -- In Supabase Dashboard > Storage
   -- Create bucket: fundus-images
   -- Set as private
   ```

4. **Seed Sample Data**
   ```sql
   \i backend/supabase_seed_data.sql
   ```

### 3. Install Dependencies

**Backend (Python)**:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend (TypeScript)**:
```bash
cd frontend
npm install
```

## 📝 API Usage Examples

### Python Backend

```python
from backend.supabase_client import MedicalResearchDB

# Initialize database connection
db = MedicalResearchDB()

# Create a patient
patient = db.create_patient(age=25, gender='male', region='India')
print(f"Created patient: {patient['patient_id']}")

# Create eyes for the patient
right_eye = db.create_eye(
    patient_id=patient['patient_id'],
    side='right',
    axial_length=24.2
)

# Upload fundus image
with open('fundus_image.jpg', 'rb') as f:
    image_data = f.read()

image_record = db.upload_fundus_image(
    eye_id=right_eye['eye_id'],
    image_file=image_data,
    filename='fundus_image.jpg',
    capture_device='Topcon TRC-50DX',
    resolution='3000x2000'
)

# Create refractive measurement
measurement = db.create_refractive_measurement(
    eye_id=right_eye['eye_id'],
    sphere=-2.5,
    cylinder=-0.75,
    axis=90,
    measurement_method='subjective'
)

# Get ML training dataset
dataset = db.get_ml_training_dataset(limit=1000)
print(f"Retrieved {len(dataset)} training samples")
```

### TypeScript Frontend

```typescript
import { database, storage, auth } from '@/lib/supabase'

// Authenticate user
const { data: authData, error: authError } = await auth.signIn(
  'researcher@example.com',
  'password'
)

// Create a patient
const { data: patient, error } = await database.patients.create({
  age: 28,
  gender: 'female',
  region: 'India'
})

// Upload fundus image
const file = event.target.files[0] // From file input
const { data: uploadData, error: uploadError, filePath } = await storage.uploadFundusImage(
  file,
  patient.patient_id,
  eyeId
)

// Create image record
if (uploadData) {
  const { data: imageRecord } = await database.fundusImages.create({
    eye_id: eyeId,
    image_url: `fundus-images/${filePath}`,
    capture_device: 'Topcon TRC-50DX',
    resolution: '3000x2000',
    captured_at: new Date().toISOString()
  })
}

// Get ML training dataset
const { data: dataset } = await database.mlTraining.getDataset(1000)
console.log(`Retrieved ${dataset?.length} training samples`)
```

## 📊 Key SQL Queries

### Fetch ML Training Dataset

```sql
SELECT 
    fi.image_url,
    rm.spherical_equivalent,
    p.age,
    p.gender,
    e.side as eye_side,
    e.axial_length
FROM fundus_images fi
JOIN eyes e ON fi.eye_id = e.eye_id
JOIN refractive_measurements rm ON e.eye_id = rm.eye_id
JOIN patients p ON e.patient_id = p.patient_id
WHERE rm.measurement_method = 'subjective'
ORDER BY fi.created_at DESC;
```

### Insert New Fundus Image

```sql
INSERT INTO fundus_images (eye_id, image_url, capture_device, resolution, captured_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    'fundus-images/patient_id/eye_id/2024-01-23T14-30-00.jpg',
    'Topcon TRC-50DX',
    '3000x2000',
    NOW()
);
```

### Log Model Training Results

```sql
INSERT INTO model_training_logs (
    model_name, dataset_version, mae, rmse, r2_score,
    training_samples, validation_samples, test_samples,
    hyperparameters, training_duration_minutes
) VALUES (
    'ResNet50', 'v1.0', 0.56, 0.78, 0.82,
    1200, 300, 150,
    '{"learning_rate": 0.001, "batch_size": 32, "epochs": 100}',
    180
);
```

## 🔍 Monitoring & Maintenance

### Database Statistics

```sql
-- Get record counts
SELECT 
    'Patients' as table_name, COUNT(*) as record_count FROM patients
UNION ALL
SELECT 'Eyes', COUNT(*) FROM eyes
UNION ALL
SELECT 'Fundus Images', COUNT(*) FROM fundus_images
UNION ALL
SELECT 'Refractive Measurements', COUNT(*) FROM refractive_measurements;
```

### Data Quality Checks

```sql
-- Check for missing relationships
SELECT 
    'Patients without eyes' as issue,
    COUNT(*) as count
FROM patients p
LEFT JOIN eyes e ON p.patient_id = e.patient_id
WHERE e.patient_id IS NULL;
```

### Storage Integrity

```sql
-- Validate storage integrity
SELECT * FROM validate_storage_integrity();
```

## 🚀 Deployment

### Production Checklist

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ✅ Create storage bucket
5. ✅ Set up RLS policies
6. ✅ Create user accounts with proper roles
7. ✅ Test authentication flow
8. ✅ Verify data upload/download
9. ✅ Set up monitoring and alerts
10. ✅ Configure backup strategy

### Security Best Practices

- Use service role key only for backend operations
- Implement proper user authentication
- Regularly audit access logs
- Monitor for unusual data access patterns
- Keep dependencies updated
- Use HTTPS for all communications

## 📞 Support

For issues or questions:
1. Check the example queries in `backend/supabase_examples.sql`
2. Review the client code in `backend/supabase_client.py` and `frontend/lib/supabase.ts`
3. Consult Supabase documentation: https://supabase.com/docs

---

**Important**: All patient data must remain anonymized. Use UUIDs only - no names, addresses, or personal identifiers.
