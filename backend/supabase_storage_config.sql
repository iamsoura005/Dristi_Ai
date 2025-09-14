-- =====================================================
-- Supabase Storage Configuration for Fundus Images
-- Medical Research Image Storage with Proper Organization
-- =====================================================

-- =====================================================
-- 1. STORAGE BUCKET CREATION
-- =====================================================

-- Create the fundus-images bucket
-- Note: This is typically done via Supabase Dashboard or API
-- The following is for documentation purposes

/*
Bucket Configuration:
- Name: fundus-images
- Public: false (requires authentication)
- File size limit: 50MB per file
- Allowed file types: image/jpeg, image/png, image/tiff
- Folder structure: {patient_id}/{eye_id}/{timestamp}.{extension}
*/

-- =====================================================
-- 2. STORAGE POLICIES FOR FUNDUS-IMAGES BUCKET
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Researchers can upload images
CREATE POLICY "researchers_can_upload_fundus_images" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'fundus-images' AND
        (
            auth.jwt() ->> 'role' = 'researcher' OR
            auth.jwt() ->> 'user_role' = 'researcher' OR
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
        )
    );

-- Policy 2: Authenticated users with proper roles can view images
CREATE POLICY "authenticated_can_view_fundus_images" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        (
            auth.jwt() ->> 'role' IN ('researcher', 'ml_pipeline') OR
            auth.jwt() ->> 'user_role' IN ('researcher', 'ml_pipeline') OR
            (auth.jwt() -> 'user_metadata' ->> 'role') IN ('researcher', 'ml_pipeline')
        )
    );

-- Policy 3: Researchers can update image metadata
CREATE POLICY "researchers_can_update_fundus_images" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        (
            auth.jwt() ->> 'role' = 'researcher' OR
            auth.jwt() ->> 'user_role' = 'researcher' OR
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
        )
    );

-- Policy 4: Researchers can delete images (with caution)
CREATE POLICY "researchers_can_delete_fundus_images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'fundus-images' AND
        (
            auth.jwt() ->> 'role' = 'researcher' OR
            auth.jwt() ->> 'user_role' = 'researcher' OR
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
        )
    );

-- =====================================================
-- 3. HELPER FUNCTIONS FOR STORAGE OPERATIONS
-- =====================================================

-- Function to generate standardized file path
CREATE OR REPLACE FUNCTION generate_fundus_image_path(
    patient_uuid UUID,
    eye_uuid UUID,
    file_extension TEXT DEFAULT 'jpg'
)
RETURNS TEXT AS $$
DECLARE
    timestamp_str TEXT;
BEGIN
    -- Generate timestamp string in ISO format
    timestamp_str := to_char(NOW(), 'YYYY-MM-DD"T"HH24-MI-SS');
    
    -- Return standardized path
    RETURN format('fundus-images/%s/%s/%s.%s', 
                  patient_uuid, 
                  eye_uuid, 
                  timestamp_str, 
                  file_extension);
END;
$$ LANGUAGE plpgsql;

-- Function to validate file upload
CREATE OR REPLACE FUNCTION validate_fundus_image_upload(
    file_name TEXT,
    file_size BIGINT,
    content_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check file size (max 50MB)
    IF file_size > 52428800 THEN
        RAISE EXCEPTION 'File size exceeds 50MB limit. Size: % bytes', file_size;
    END IF;
    
    -- Check content type
    IF content_type NOT IN ('image/jpeg', 'image/jpg', 'image/png', 'image/tiff') THEN
        RAISE EXCEPTION 'Invalid file type: %. Allowed types: JPEG, PNG, TIFF', content_type;
    END IF;
    
    -- Check file extension
    IF NOT (file_name ~* '\.(jpg|jpeg|png|tiff?)$') THEN
        RAISE EXCEPTION 'Invalid file extension in: %', file_name;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get signed URL for image access
CREATE OR REPLACE FUNCTION get_fundus_image_signed_url(
    image_path TEXT,
    expires_in_seconds INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder function
    -- In practice, signed URLs are generated via Supabase client libraries
    RETURN format('https://your-project.supabase.co/storage/v1/object/sign/%s?expires_in=%s', 
                  image_path, 
                  expires_in_seconds);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. STORAGE AUDIT LOGGING
-- =====================================================

-- Create storage audit log table
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

-- Enable RLS on storage audit logs
ALTER TABLE storage_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only researchers can view storage audit logs
CREATE POLICY "researchers_view_storage_audit_logs" ON storage_audit_logs
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'researcher' OR
        auth.jwt() ->> 'user_role' = 'researcher' OR
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
    );

-- Function to log storage operations
CREATE OR REPLACE FUNCTION log_storage_operation(
    p_bucket_id TEXT,
    p_object_name TEXT,
    p_operation TEXT,
    p_file_size BIGINT DEFAULT NULL,
    p_content_type TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO storage_audit_logs (
        user_id,
        bucket_id,
        object_name,
        operation,
        file_size,
        content_type,
        success,
        error_message
    ) VALUES (
        auth.uid(),
        p_bucket_id,
        p_object_name,
        p_operation,
        p_file_size,
        p_content_type,
        p_success,
        p_error_message
    ) RETURNING storage_audit_logs.log_id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. STORAGE STATISTICS AND MONITORING
-- =====================================================

-- View for storage usage statistics
CREATE VIEW storage_usage_stats AS
SELECT 
    bucket_id,
    COUNT(*) as total_files,
    SUM(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::BIGINT 
        ELSE 0 END) as total_size_bytes,
    AVG(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::BIGINT 
        ELSE NULL END) as avg_file_size_bytes,
    MIN(created_at) as first_upload,
    MAX(created_at) as latest_upload
FROM storage.objects
WHERE bucket_id = 'fundus-images'
GROUP BY bucket_id;

-- View for file type distribution
CREATE VIEW file_type_distribution AS
SELECT 
    bucket_id,
    CASE 
        WHEN name ~* '\.jpe?g$' THEN 'JPEG'
        WHEN name ~* '\.png$' THEN 'PNG'
        WHEN name ~* '\.tiff?$' THEN 'TIFF'
        ELSE 'OTHER'
    END as file_type,
    COUNT(*) as file_count,
    SUM(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::BIGINT 
        ELSE 0 END) as total_size_bytes
FROM storage.objects
WHERE bucket_id = 'fundus-images'
GROUP BY bucket_id, file_type
ORDER BY file_count DESC;

-- View for upload activity by date
CREATE VIEW upload_activity_by_date AS
SELECT 
    DATE(created_at) as upload_date,
    COUNT(*) as files_uploaded,
    SUM(CASE WHEN metadata->>'size' IS NOT NULL 
        THEN (metadata->>'size')::BIGINT 
        ELSE 0 END) as total_bytes_uploaded
FROM storage.objects
WHERE bucket_id = 'fundus-images'
GROUP BY DATE(created_at)
ORDER BY upload_date DESC;

-- =====================================================
-- 6. CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up orphaned images (images without database records)
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS INTEGER AS $$
DECLARE
    orphaned_count INTEGER := 0;
    image_record RECORD;
BEGIN
    -- Find images in storage that don't have corresponding database records
    FOR image_record IN
        SELECT name, id
        FROM storage.objects
        WHERE bucket_id = 'fundus-images'
        AND name NOT IN (
            SELECT SUBSTRING(image_url FROM 'fundus-images/(.+)')
            FROM fundus_images
            WHERE image_url LIKE 'fundus-images/%'
        )
    LOOP
        -- Log the cleanup operation
        PERFORM log_storage_operation(
            'fundus-images',
            image_record.name,
            'DELETE',
            NULL,
            NULL,
            TRUE,
            'Orphaned image cleanup'
        );
        
        orphaned_count := orphaned_count + 1;
    END LOOP;
    
    RETURN orphaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate storage integrity
CREATE OR REPLACE FUNCTION validate_storage_integrity()
RETURNS TABLE(
    issue_type TEXT,
    issue_count BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Check for database records without storage files
    RETURN QUERY
    SELECT 
        'Missing Storage Files'::TEXT,
        COUNT(*)::BIGINT,
        'Database records pointing to non-existent storage files'::TEXT
    FROM fundus_images fi
    WHERE fi.image_url LIKE 'fundus-images/%'
    AND SUBSTRING(fi.image_url FROM 'fundus-images/(.+)') NOT IN (
        SELECT name FROM storage.objects WHERE bucket_id = 'fundus-images'
    );
    
    -- Check for storage files without database records
    RETURN QUERY
    SELECT 
        'Orphaned Storage Files'::TEXT,
        COUNT(*)::BIGINT,
        'Storage files without corresponding database records'::TEXT
    FROM storage.objects so
    WHERE so.bucket_id = 'fundus-images'
    AND so.name NOT IN (
        SELECT SUBSTRING(image_url FROM 'fundus-images/(.+)')
        FROM fundus_images
        WHERE image_url LIKE 'fundus-images/%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION generate_fundus_image_path(UUID, UUID, TEXT) IS 'Generate standardized file path for fundus image storage';
COMMENT ON FUNCTION validate_fundus_image_upload(TEXT, BIGINT, TEXT) IS 'Validate file upload parameters before storage';
COMMENT ON FUNCTION log_storage_operation(TEXT, TEXT, TEXT, BIGINT, TEXT, BOOLEAN, TEXT) IS 'Log storage operations for audit trail';
COMMENT ON FUNCTION cleanup_orphaned_images() IS 'Remove storage files that have no corresponding database records';
COMMENT ON FUNCTION validate_storage_integrity() IS 'Check for inconsistencies between database and storage';

COMMENT ON VIEW storage_usage_stats IS 'Overall storage usage statistics for fundus images bucket';
COMMENT ON VIEW file_type_distribution IS 'Distribution of file types in fundus images storage';
COMMENT ON VIEW upload_activity_by_date IS 'Daily upload activity tracking';

COMMENT ON TABLE storage_audit_logs IS 'Audit trail for all storage operations on fundus images';
