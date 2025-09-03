import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

// Enable CORS
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['POST', 'GET'],
}));

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Verify user access
const verifyUserAccess = async (accessToken: string) => {
  const supabase = getSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      throw new Error('Invalid access token');
    }

    return user;
  } catch (error) {
    throw new Error('Unauthorized access');
  }
};

// Mock OCR function for passport MRZ extraction
const extractPassportMRZ = async (filePath: string): Promise<any> => {
  // In a real implementation, this would:
  // 1. Download the file from Supabase Storage
  // 2. Use an OCR library (like Tesseract.js) to extract MRZ
  // 3. Parse the MRZ to extract passport data
  
  // For now, we'll simulate OCR results
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
  
  // Mock extracted data - in production this would come from actual OCR
  const mockOCRResult = {
    mrz_ok: true,
    dob: '1985-06-15',
    nationality: 'French',
    place_of_birth: 'Paris, France',
    sex: 'M',
    expiry_date: '2028-12-31',
    passport_number: 'AB123456',
    issuing_country: 'France',
    surname: 'DUPONT',
    given_names: 'JEAN PIERRE'
  };
  
  return mockOCRResult;
};

// POST /ocr-passport - Process passport OCR
app.post('/ocr-passport', async (c) => {
  try {
    console.log('Passport OCR request received');
    
    // Get authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }
    
    const accessToken = authHeader.split(' ')[1];
    
    // Verify user access
    const user = await verifyUserAccess(accessToken);
    console.log('User verified for OCR:', user.email);
    
    // Parse request body
    const body = await c.req.json();
    const { user_id, storage_path } = body;
    
    // Validate required fields
    if (!user_id || !storage_path) {
      return c.json({
        error: 'Missing required fields: user_id, storage_path'
      }, 400);
    }
    
    // Verify user can only process their own documents
    if (user_id !== user.id) {
      return c.json({
        error: 'Can only process your own documents'
      }, 403);
    }
    
    console.log('Processing OCR for file:', storage_path);
    
    const supabase = getSupabaseClient();
    
    try {
      // Extract passport data using OCR
      const ocrResult = await extractPassportMRZ(storage_path);
      
      if (!ocrResult.mrz_ok) {
        return c.json({
          error: 'Failed to read passport MRZ. Please ensure the image is clear and the MRZ is visible.',
          mrz_ok: false
        }, 400);
      }
      
      // Update user profile with extracted data
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          birth_date: ocrResult.dob,
          nationality: ocrResult.nationality,
          updated_at: new Date().toISOString()
        })
        .eq('id', user_id);
      
      if (userUpdateError) {
        console.error('Error updating user profile:', userUpdateError);
        // Don't fail the request, just log the error
      }
      
      // Update auth user metadata with passport details
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          profile: {
            ...user.user_metadata?.profile,
            place_of_birth: ocrResult.place_of_birth,
            gender: ocrResult.sex
          },
          passport: {
            passport_number: ocrResult.passport_number,
            issuing_country: ocrResult.issuing_country,
            expiry_date: ocrResult.expiry_date,
            surname: ocrResult.surname,
            given_names: ocrResult.given_names,
            ocr_processed: true,
            ocr_timestamp: new Date().toISOString()
          }
        }
      });
      
      if (authUpdateError) {
        console.error('Error updating auth metadata:', authUpdateError);
        // Don't fail the request, just log the error
      }
      
      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          type: 'other',
          user_id: user_id,
          title: 'Passport',
          storage_path: storage_path,
          metadata: {
            source: 'user',
            kind: 'passport',
            ocr_result: ocrResult,
            processed_at: new Date().toISOString()
          }
        });
      
      if (docError) {
        console.error('Error creating document record:', docError);
        // Don't fail the request, just log the error
      }
      
      // Create notification for HR review
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'SYSTEM',
          title: 'Passport uploaded',
          message: 'Your passport has been uploaded and is awaiting HR validation.',
          action_required: true,
          created_at: new Date().toISOString()
        });
      
      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the request, just log the error
      }
      
      console.log('OCR processing completed successfully');
      
      return c.json({
        mrz_ok: true,
        dob: ocrResult.dob,
        nationality: ocrResult.nationality,
        place_of_birth: ocrResult.place_of_birth,
        sex: ocrResult.sex,
        expiry_date: ocrResult.expiry_date,
        passport_number: ocrResult.passport_number,
        issuing_country: ocrResult.issuing_country,
        message: 'Passport processed successfully'
      });
      
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError);
      return c.json({
        error: 'Failed to process passport document',
        details: ocrError.message,
        mrz_ok: false
      }, 500);
    }
    
  } catch (error) {
    console.error('Passport OCR error:', error);
    return c.json({
      error: 'Internal server error',
      details: error.message
    }, 500);
  }
});

export default app;