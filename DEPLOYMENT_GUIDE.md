# 🚀 Supabase Medical Research Backend - Complete Deployment Guide

## Step 1: Set up Supabase Project Infrastructure

### 1.1 Create Supabase Project

1. **Visit Supabase Dashboard**
   ```bash
   # Open in browser
   https://supabase.com/dashboard
   ```

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Project name: `medical-research-backend`
   - Database password: Generate strong password
   - Region: Choose closest to your users
   - Pricing plan: Select appropriate tier

3. **Wait for Project Setup** (2-3 minutes)

### 1.2 Configure Environment Variables

1. **Get Supabase Credentials**
   - Go to Settings > API
   - Copy Project URL
   - Copy `anon` public key
   - Copy `service_role` secret key

2. **Create Backend Environment File**
   ```bash
   cd backend
   cp ../.env.supabase.example .env
   ```

3. **Update `.env` file**:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
   
   # Database URL
   DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
   
   # Security
   JWT_SECRET_KEY=your-ultra-secure-jwt-secret-key
   ENCRYPTION_KEY=your-32-character-encryption-key
   ```

4. **Create Frontend Environment File**
   ```bash
   cd frontend
   cp ../.env.supabase.example .env.local
   ```

5. **Update `frontend/.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

### 1.3 Execute Database Migration Scripts

1. **Open Supabase SQL Editor**
   - Go to your project dashboard
   - Click "SQL Editor" in sidebar
   - Click "New query"

2. **Run Complete Setup Script**
   ```sql
   -- Copy and paste content from backend/setup_supabase_complete.sql
   -- Execute the script
   ```

3. **Verify Tables Created**
   ```sql
   -- Check tables
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('patients', 'eyes', 'fundus_images', 'refractive_measurements', 'model_training_logs')
   ORDER BY tablename;
   ```

4. **Run Seed Data Script**
   ```sql
   -- Copy and paste content from backend/supabase_seed_data.sql
   -- Execute the script
   ```

5. **Verify Data Inserted**
   ```sql
   -- Check record counts
   SELECT 
       'Patients' as table_name, COUNT(*) as record_count FROM patients
   UNION ALL
   SELECT 'Eyes', COUNT(*) FROM eyes
   UNION ALL
   SELECT 'Fundus Images', COUNT(*) FROM fundus_images
   UNION ALL
   SELECT 'Refractive Measurements', COUNT(*) FROM refractive_measurements
   UNION ALL
   SELECT 'Model Training Logs', COUNT(*) FROM model_training_logs;
   ```

### 1.4 Create Storage Bucket

1. **Navigate to Storage**
   - Click "Storage" in sidebar
   - Click "Create a new bucket"

2. **Configure Bucket**
   - Bucket name: `fundus-images`
   - Public bucket: **OFF** (keep private)
   - File size limit: 50MB
   - Allowed MIME types: `image/jpeg,image/png,image/tiff`

3. **Verify Bucket Created**
   - Should see `fundus-images` in bucket list
   - Test upload a sample image

### 1.5 Set up User Accounts

1. **Create Researcher Account**
   ```bash
   # Use Supabase Auth API or Dashboard
   curl -X POST 'https://your-project-id.supabase.co/auth/v1/signup' \
   -H "apikey: your-anon-key" \
   -H "Content-Type: application/json" \
   -d '{
     "email": "researcher@example.com",
     "password": "SecurePassword123!",
     "data": {
       "role": "researcher",
       "name": "Dr. Jane Smith"
     }
   }'
   ```

2. **Create ML Pipeline Account**
   ```bash
   curl -X POST 'https://your-project-id.supabase.co/auth/v1/signup' \
   -H "apikey: your-anon-key" \
   -H "Content-Type: application/json" \
   -d '{
     "email": "ml-pipeline@example.com",
     "password": "SecurePassword123!",
     "data": {
       "role": "ml_pipeline",
       "name": "ML Training Pipeline"
     }
   }'
   ```

3. **Verify User Roles**
   ```sql
   -- Check users in auth.users table
   SELECT 
       id,
       email,
       raw_user_meta_data->>'role' as role,
       raw_user_meta_data->>'name' as name,
       created_at
   FROM auth.users
   ORDER BY created_at;
   ```

### 1.6 Verify Setup

1. **Test Database Connectivity**
   ```bash
   cd backend
   python -c "
   from supabase_client import MedicalResearchDB
   db = MedicalResearchDB()
   if db.health_check():
       print('✅ Database connection successful')
       stats = db.get_database_stats()
       print(f'📊 Database stats: {stats}')
   else:
       print('❌ Database connection failed')
   "
   ```

2. **Test RLS Policies**
   ```python
   # Test researcher access
   from supabase_client import MedicalResearchDB
   
   # This should work with researcher credentials
   db = MedicalResearchDB()
   patients = db.list_patients(limit=5)
   print(f"✅ Researcher can access {len(patients)} patients")
   
   # Test creating new patient
   new_patient = db.create_patient(age=30, gender='female', region='USA')
   print(f"✅ Created patient: {new_patient['patient_id']}")
   ```

3. **Test Storage Access**
   ```python
   # Test image upload
   with open('test_image.jpg', 'rb') as f:
       image_data = f.read()
   
   # Upload test image
   result = db.upload_fundus_image(
       eye_id='660e8400-e29b-41d4-a716-446655440001',  # Use existing eye ID
       image_file=image_data,
       filename='test_image.jpg',
       capture_device='Test Device'
   )
   print(f"✅ Image uploaded: {result['image_id']}")
   ```

### 1.7 Setup Verification Checklist

- [ ] Supabase project created and accessible
- [ ] Environment variables configured in both backend and frontend
- [ ] Database schema deployed successfully (5 tables + views)
- [ ] Sample data inserted (8 patients, 16 eyes, 16 images, etc.)
- [ ] Storage bucket `fundus-images` created and configured
- [ ] User accounts created with proper roles
- [ ] Database connectivity tested from Python client
- [ ] RLS policies working correctly
- [ ] Storage upload/download tested
- [ ] Audit logging functional

## Common Issues and Solutions

### Issue 1: Database Connection Failed
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verify project is active in Supabase dashboard
# Check if IP is whitelisted (if using IP restrictions)
```

### Issue 2: RLS Policies Not Working
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check user role in JWT
SELECT auth.jwt() ->> 'role' as user_role;
```

### Issue 3: Storage Upload Failed
```bash
# Check bucket exists and is configured correctly
# Verify file size and type restrictions
# Check storage policies in Supabase dashboard
```

### Issue 4: User Authentication Failed
```sql
-- Check user exists and has correct role
SELECT email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

## Next Steps

Once infrastructure setup is complete:

1. ✅ **Infrastructure Ready** - Move to ML Pipeline Implementation
2. 🔄 **ML Training** - Implement model training pipeline
3. 🔄 **Frontend Development** - Build research interface
4. 🔄 **Production Deployment** - Configure security and scaling

---

**Security Note**: Keep your service role key secret and never expose it in frontend code. Use environment variables and secure deployment practices.
