import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const qualificationsApp = new Hono();

// CORS middleware
qualificationsApp.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Create Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET /qualifications - List all qualifications
qualificationsApp.get('/', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('qualifications')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching qualifications:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch qualifications',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in GET /qualifications:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while fetching qualifications',
      details: error.message 
    }, 500);
  }
});

// GET /qualifications/user/:userId - Get qualifications for a specific user
qualificationsApp.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('qualifications')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching user qualifications:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch user qualifications',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in GET /qualifications/user/:userId:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while fetching user qualifications',
      details: error.message 
    }, 500);
  }
});

// GET /qualifications/valid/:userId - Get valid qualifications for a specific user
qualificationsApp.get('/valid/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('qualifications')
      .select('*')
      .eq('user_id', userId)
      .eq('valid', true)
      .or('expiry_date.is.null,expiry_date.gt.' + new Date().toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching valid qualifications:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch valid qualifications',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in GET /qualifications/valid/:userId:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while fetching valid qualifications',
      details: error.message 
    }, 500);
  }
});

// GET /qualifications/type/:userId/:type - Get qualifications by type for a specific user
qualificationsApp.get('/type/:userId/:type', async (c) => {
  try {
    const userId = c.req.param('userId');
    const type = c.req.param('type');
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('qualifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('valid', true)
      .or('expiry_date.is.null,expiry_date.gt.' + new Date().toISOString())
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching qualifications by type:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch qualifications by type',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error in GET /qualifications/type/:userId/:type:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while fetching qualifications by type',
      details: error.message 
    }, 500);
  }
});

// POST /qualifications - Create a new qualification
qualificationsApp.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    // Validate required fields
    if (!body.user_id || !body.type) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: user_id and type are required' 
      }, 400);
    }
    
    const { data, error } = await supabase
      .from('qualifications')
      .insert([{
        user_id: body.user_id,
        type: body.type,
        code: body.code || null,
        aircraft_type: body.aircraft_type || null,
        class: body.class || null,
        level: body.level || null,
        issued_date: body.issued_date || null,
        expiry_date: body.expiry_date || null,
        valid: body.valid !== false // Default to true unless explicitly set to false
      }])
      .select();

    if (error) {
      console.error('Error creating qualification:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to create qualification',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Error in POST /qualifications:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while creating qualification',
      details: error.message 
    }, 500);
  }
});

// PUT /qualifications/:id - Update a qualification
qualificationsApp.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('qualifications')
      .update({
        type: body.type,
        code: body.code,
        aircraft_type: body.aircraft_type,
        class: body.class,
        level: body.level,
        issued_date: body.issued_date,
        expiry_date: body.expiry_date,
        valid: body.valid,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating qualification:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to update qualification',
        details: error.message 
      }, 500);
    }

    if (!data || data.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Qualification not found' 
      }, 404);
    }

    return c.json({
      success: true,
      data: data[0]
    });
  } catch (error) {
    console.error('Error in PUT /qualifications/:id:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while updating qualification',
      details: error.message 
    }, 500);
  }
});

// DELETE /qualifications/:id - Delete a qualification
qualificationsApp.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('qualifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting qualification:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to delete qualification',
        details: error.message 
      }, 500);
    }

    return c.json({
      success: true,
      message: 'Qualification deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /qualifications/:id:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while deleting qualification',
      details: error.message 
    }, 500);
  }
});

// GET /qualifications/positions - Get unique positions from qualifications
qualificationsApp.get('/positions', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get unique positions from qualifications where type is 'competency' or 'license'
    const { data, error } = await supabase
      .from('qualifications')
      .select('level')
      .in('type', ['competency', 'license'])
      .eq('valid', true)
      .not('level', 'is', null);

    if (error) {
      console.error('Error fetching positions:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to fetch positions',
        details: error.message 
      }, 500);
    }

    // Extract unique positions
    const positions = [...new Set((data || []).map(item => item.level).filter(Boolean))];
    
    return c.json({
      success: true,
      data: positions.sort()
    });
  } catch (error) {
    console.error('Error in GET /qualifications/positions:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error while fetching positions',
      details: error.message 
    }, 500);
  }
});

export default qualificationsApp;