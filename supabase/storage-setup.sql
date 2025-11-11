-- Storage Bucket Setup for KYC Documents
-- Run this file in the SQL editor of your Supabase project after running schema.sql

-- Create bucket for KYC documents (private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "kyc_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "kyc_documents_read" ON storage.objects;
DROP POLICY IF EXISTS "kyc_documents_delete" ON storage.objects;
DROP POLICY IF EXISTS "kyc_documents_service_all" ON storage.objects;

-- Policy: Users can only upload their own files
-- Files are stored in path: {user_id}/{timestamp}-{type}.{ext}
CREATE POLICY "kyc_documents_upload" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  (
    auth.uid()::text = (string_to_array(name, '/'))[1] OR
    auth.role() = 'service_role'
  )
);

-- Policy: Users can only read their own files
CREATE POLICY "kyc_documents_read" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents' AND
  (
    auth.uid()::text = (string_to_array(name, '/'))[1] OR
    auth.role() = 'service_role'
  )
);

-- Policy: Users can delete their own files (before review)
CREATE POLICY "kyc_documents_delete" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kyc-documents' AND
  (
    auth.uid()::text = (string_to_array(name, '/'))[1] OR
    auth.role() = 'service_role'
  )
);

-- Policy: Service role can manage all files
CREATE POLICY "kyc_documents_service_all" ON storage.objects
FOR ALL
USING (
  bucket_id = 'kyc-documents' AND
  auth.role() = 'service_role'
);

