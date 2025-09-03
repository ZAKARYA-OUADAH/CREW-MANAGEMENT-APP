import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const authRoutes = new Hono();

// Check environment variables on startup
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

console.log('Auth Routes - Environment check:', {
  SUPABASE_URL: SUPABASE_URL ? 'SET' : 'MISSING',
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Initialize Supabase client for auth operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Signup endpoint
authRoutes.post("/signup", async (c) => {
  console.log('Signup endpoint called');
  
  try {
    const requestBody = await c.req.json();
    console.log('Signup request data:', { 
      email: requestBody.email, 
      hasPassword: !!requestBody.password,
      name: requestBody.name,
      role: requestBody.role,
      type: requestBody.type 
    });
    
    const { email, password, name, role, type } = requestBody;
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields: email, password, and name are required' }, 400);
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'freelancer', type: type || 'freelancer' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return c.json({ error: authError.message }, 400);
    }

    if (!authData.user) {
      console.error('No user data returned from Supabase');
      return c.json({ error: 'Failed to create user - no user data returned' }, 500);
    }

    console.log('User created successfully:', authData.user.id);

    // Store additional user data
    const userData = {
      id: authData.user.id,
      email,
      name,
      role: role || 'freelancer',
      type: type || 'freelancer',
      created_at: new Date().toISOString(),
      profile_complete: false
    };

    await kv.set(`user:${authData.user.id}`, userData);
    console.log('User data stored in KV store');
    
    return c.json({ 
      message: 'User created successfully',
      user: userData 
    });
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: `Internal server error during signup: ${error.message}` }, 500);
  }
});

// Login endpoint
authRoutes.post("/login", async (c) => {
  console.log('Login endpoint called');
  
  try {
    const requestBody = await c.req.json();
    console.log('Login request data:', { 
      email: requestBody.email, 
      hasPassword: !!requestBody.password 
    });
    
    const { email, password } = requestBody;
    
    if (!email || !password) {
      return c.json({ error: 'Missing required fields: email and password are required' }, 400);
    }
    
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.session || !data.user) {
      console.error('No session or user data returned from login');
      return c.json({ error: 'Login failed - no session data' }, 400);
    }

    console.log('User logged in successfully:', data.user.id);

    // Get user data from KV store
    let userData = await kv.get(`user:${data.user.id}`);
    
    if (!userData) {
      console.log('No user data in KV store, creating from auth data');
      userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'User',
        role: data.user.user_metadata?.role || 'freelancer',
        type: data.user.user_metadata?.type || 'freelancer',
        created_at: new Date().toISOString(),
        profile_complete: false
      };
      await kv.set(`user:${data.user.id}`, userData);
    }

    return c.json({
      access_token: data.session.access_token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: `Internal server error during login: ${error.message}` }, 500);
  }
});

// Update user metadata endpoint
authRoutes.post("/update-metadata", async (c) => {
  console.log('Update metadata endpoint called');
  
  try {
    const requestBody = await c.req.json();
    const { metadata } = requestBody;
    
    if (!metadata) {
      return c.json({ error: 'Missing metadata field' }, 400);
    }
    
    // Get the access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Error getting user from token:', userError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    console.log('Updating metadata for user:', user.id, 'Metadata:', metadata);
    
    // Update user metadata
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          ...metadata
        }
      }
    );
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return c.json({ error: 'Failed to update metadata' }, 500);
    }
    
    console.log('User metadata updated successfully for user:', user.id);
    
    return c.json({
      success: true,
      message: 'Metadata updated successfully',
      user: updateData.user
    });
    
  } catch (error) {
    console.error('Update metadata error:', error);
    return c.json({ error: `Internal server error: ${error.message}` }, 500);
  }
});

// Upload document endpoint (for certificates, passport, etc.)
authRoutes.post("/upload-document", async (c) => {
  console.log('Upload document endpoint called');
  
  try {
    // Get the access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    console.log('🔍 Attempting to validate access token...');
    
    // Try to get user from access token using service role client
    const serviceRoleClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let { data: { user }, error: userError } = await serviceRoleClient.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Error getting user from token:', userError);
      
      // Fallback: try with anon key client
      console.log('🔄 Trying with anon key client...');
      const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: { user: anonUser }, error: anonError } = await anonClient.auth.getUser(accessToken);
      
      if (anonError || !anonUser) {
        console.error('Authentication failed with both clients:', { userError, anonError });
        return c.json({ error: 'Invalid access token or session expired' }, 401);
      }
      
      // Use the user from anon client
      user = anonUser;
      console.log('✅ Authentication successful with anon client for user:', user.id);
    } else {
      console.log('✅ Authentication successful with service role client for user:', user.id);
    }
    
    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folder = formData.get('folder') as string || 'documents';
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    if (!fileName) {
      return c.json({ error: 'No filename provided' }, 400);
    }
    
    console.log('Uploading document:', { fileName, folder, fileSize: file.size, fileType: file.type });
    
    // Generate unique file path
    const timestamp = Date.now();
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${folder}/${user.id}/${timestamp}_${fileName}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Create or ensure bucket exists (use service role for admin operations)
    const bucketName = 'user-documents';
    console.log('🗂️ Checking if bucket exists:', bucketName);
    
    const storageClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: buckets } = await storageClient.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('🗂️ Creating bucket:', bucketName);
      const { error: bucketError } = await storageClient.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (bucketError) {
        console.error('Error creating bucket:', bucketError);
        return c.json({ error: 'Failed to create storage bucket' }, 500);
      }
    }
    
    // Upload file to Supabase Storage using service role for reliable access
    console.log('📤 Uploading to bucket:', bucketName, 'with path:', uniqueFileName);
    console.log('📤 File details:', { size: fileBuffer.length, contentType: file.type });
    
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from(bucketName)
      .upload(uniqueFileName, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }
    
    console.log('Document uploaded successfully:', uploadData.path);
    
    // Get the public URL (signed URL for private bucket)
    const { data: signedUrl } = await storageClient.storage
      .from(bucketName)
      .createSignedUrl(uploadData.path, 3600 * 24 * 365); // 1 year expiry
    
    return c.json({
      success: true,
      message: 'Document uploaded successfully',
      path: uploadData.path,
      url: signedUrl?.signedUrl,
      fileName: fileName,
      fileSize: file.size
    });
    
  } catch (error) {
    console.error('Upload document error:', error);
    return c.json({ error: `Internal server error: ${error.message}` }, 500);
  }
});

// Save qualifications endpoint - uses Supabase qualifications table
authRoutes.post("/save-qualifications", async (c) => {
  console.log('Save qualifications endpoint called');
  
  try {
    // Get the access token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.replace('Bearer ', '');
    
    // Get user from access token
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !user) {
      console.error('Error getting user from token:', userError);
      return c.json({ error: 'Invalid access token' }, 401);
    }
    
    const requestBody = await c.req.json();
    const { qualifications } = requestBody;
    
    if (!qualifications || !Array.isArray(qualifications)) {
      return c.json({ error: 'Missing or invalid qualifications data' }, 400);
    }
    
    console.log('Saving qualifications for user:', user.id, 'Count:', qualifications.length);
    
    // Prepare qualifications data for Supabase table
    const qualificationsData = qualifications.map(qual => ({
      user_id: user.id,
      type: qual.type,
      code: qual.code,
      aircraft_type: qual.aircraft_type || null,
      issued_date: qual.issued_date,
      expiry_date: qual.expiry_date,
      valid: true
    }));
    
    // Insert qualifications into Supabase table
    const { data: savedQualifications, error: insertError } = await supabase
      .from('qualifications')
      .insert(qualificationsData)
      .select();
    
    if (insertError) {
      console.error('Error inserting qualifications:', insertError);
      return c.json({ error: `Failed to save qualifications: ${insertError.message}` }, 500);
    }
    
    console.log('Successfully saved qualifications:', savedQualifications);
    
    // Update user metadata to mark certificates as completed
    try {
      await supabase.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            certificates_completed: true,
            certificates_completed_at: new Date().toISOString(),
            certificates_count: qualifications.length
          }
        }
      );
      console.log('User metadata updated with qualifications completion status');
    } catch (metadataError) {
      console.warn('Failed to update metadata, but qualifications were saved:', metadataError);
    }
    
    // Update user profile completion status in KV store
    try {
      const userData = await kv.get(`user:${user.id}`);
      if (userData) {
        userData.certificates_completed = true;
        userData.profile_complete = true; // Mark as complete since this is the last step
        await kv.set(`user:${user.id}`, userData);
      }
    } catch (userDataError) {
      console.warn('Failed to update user profile status:', userDataError);
    }
    
    console.log('Successfully saved', savedQualifications.length, 'qualifications for user:', user.id);
    
    return c.json({
      success: true,
      message: 'Qualifications saved successfully',
      qualifications: savedQualifications,
      count: savedQualifications.length
    });
    
  } catch (error) {
    console.error('Save qualifications error:', error);
    return c.json({ error: `Internal server error: ${error.message}` }, 500);
  }
});

export default authRoutes;