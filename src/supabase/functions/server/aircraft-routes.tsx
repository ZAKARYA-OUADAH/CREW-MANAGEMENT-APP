import { Hono } from 'npm:hono';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

// Get all aircraft
app.get('/aircraft', async (c) => {
  try {
    console.log('[Aircraft Routes] GET /aircraft - Fetching all aircraft');

    // Try to fetch from Supabase first
    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .order('registration');

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      
      // Fallback to KV store
      try {
        const kvData = await kv.get('aircraft_list');
        if (kvData) {
          console.log('[Aircraft Routes] Using KV fallback data');
          return c.json({
            success: true,
            data: JSON.parse(kvData),
            source: 'kv_fallback'
          });
        }
      } catch (kvError) {
        console.error('[Aircraft Routes] KV fallback failed:', kvError);
      }

      return c.json({
        success: false,
        error: 'Failed to fetch aircraft',
        details: error.message
      }, 500);
    }

    // Store in KV as cache
    try {
      await kv.set('aircraft_list', JSON.stringify(data));
    } catch (kvError) {
      console.warn('[Aircraft Routes] Failed to cache in KV:', kvError);
    }

    console.log(`[Aircraft Routes] Successfully fetched ${data.length} aircraft`);
    return c.json({
      success: true,
      data: data,
      source: 'supabase'
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Get aircraft by ID
app.get('/aircraft/:id', async (c) => {
  try {
    const id = c.req.param('id');
    console.log(`[Aircraft Routes] GET /aircraft/${id} - Fetching aircraft by ID`);

    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch aircraft',
        details: error.message
      }, 404);
    }

    console.log(`[Aircraft Routes] Successfully fetched aircraft: ${data.registration}`);
    return c.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Get aircraft by registration
app.get('/aircraft/registration/:registration', async (c) => {
  try {
    const registration = c.req.param('registration');
    console.log(`[Aircraft Routes] GET /aircraft/registration/${registration} - Fetching aircraft by registration`);

    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('registration', registration)
      .single();

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch aircraft',
        details: error.message
      }, 404);
    }

    console.log(`[Aircraft Routes] Successfully fetched aircraft: ${data.registration}`);
    return c.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Get available aircraft only
app.get('/aircraft/status/available', async (c) => {
  try {
    console.log('[Aircraft Routes] GET /aircraft/status/available - Fetching available aircraft');

    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('status', 'available')
      .order('registration');

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch available aircraft',
        details: error.message
      }, 500);
    }

    console.log(`[Aircraft Routes] Successfully fetched ${data.length} available aircraft`);
    return c.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Create new aircraft (admin only)
app.post('/aircraft', async (c) => {
  try {
    const body = await c.req.json();
    console.log('[Aircraft Routes] POST /aircraft - Creating new aircraft:', body.registration);

    const { data, error } = await supabase
      .from('aircraft')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to create aircraft',
        details: error.message
      }, 400);
    }

    // Clear cache
    try {
      await kv.del('aircraft_list');
    } catch (kvError) {
      console.warn('[Aircraft Routes] Failed to clear KV cache:', kvError);
    }

    console.log(`[Aircraft Routes] Successfully created aircraft: ${data.registration}`);
    return c.json({
      success: true,
      data: data
    }, 201);

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Update aircraft (admin only)
app.put('/aircraft/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    console.log(`[Aircraft Routes] PUT /aircraft/${id} - Updating aircraft`);

    const { data, error } = await supabase
      .from('aircraft')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to update aircraft',
        details: error.message
      }, 400);
    }

    // Clear cache
    try {
      await kv.del('aircraft_list');
    } catch (kvError) {
      console.warn('[Aircraft Routes] Failed to clear KV cache:', kvError);
    }

    console.log(`[Aircraft Routes] Successfully updated aircraft: ${data.registration}`);
    return c.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Delete aircraft (admin only)
app.delete('/aircraft/:id', async (c) => {
  try {
    const id = c.req.param('id');
    console.log(`[Aircraft Routes] DELETE /aircraft/${id} - Deleting aircraft`);

    const { error } = await supabase
      .from('aircraft')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Aircraft Routes] Supabase error:', error);
      return c.json({
        success: false,
        error: 'Failed to delete aircraft',
        details: error.message
      }, 400);
    }

    // Clear cache
    try {
      await kv.del('aircraft_list');
    } catch (kvError) {
      console.warn('[Aircraft Routes] Failed to clear KV cache:', kvError);
    }

    console.log(`[Aircraft Routes] Successfully deleted aircraft: ${id}`);
    return c.json({
      success: true,
      message: 'Aircraft deleted successfully'
    });

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

// Seed aircraft data (for testing)
app.post('/aircraft/seed', async (c) => {
  try {
    console.log('[Aircraft Routes] POST /aircraft/seed - Seeding aircraft data');

    const seedData = [
      {
        registration: 'F-HCTA',
        type: 'Citation CJ3+',
        manufacturer: 'Cessna',
        model: 'CJ3+',
        category: 'Business Jet',
        max_passengers: 8,
        pilots_required: 2,
        cabin_crew_required: 0,
        range_nm: 2040,
        cruise_speed: 416,
        service_ceiling: 45000,
        base_airport: 'LFPB',
        status: 'available',
        hourly_cost: 3200.00,
        currency: 'EUR'
      },
      {
        registration: 'F-HCTB',
        type: 'King Air 350',
        manufacturer: 'Beechcraft',
        model: '350',
        category: 'Turboprop',
        max_passengers: 9,
        pilots_required: 2,
        cabin_crew_required: 0,
        range_nm: 1806,
        cruise_speed: 312,
        service_ceiling: 35000,
        base_airport: 'LFPB',
        status: 'available',
        hourly_cost: 2800.00,
        currency: 'EUR'
      },
      {
        registration: 'F-HCTC',
        type: 'Phenom 300',
        manufacturer: 'Embraer',
        model: '300',
        category: 'Light Jet',
        max_passengers: 7,
        pilots_required: 2,
        cabin_crew_required: 0,
        range_nm: 1971,
        cruise_speed: 453,
        service_ceiling: 45000,
        base_airport: 'LFPB',
        status: 'maintenance',
        hourly_cost: 3500.00,
        currency: 'EUR',
        maintenance_until: '2024-12-31'
      }
    ];

    const { data, error } = await supabase
      .from('aircraft')
      .insert(seedData)
      .select();

    if (error) {
      console.error('[Aircraft Routes] Seeding error:', error);
      return c.json({
        success: false,
        error: 'Failed to seed aircraft data',
        details: error.message
      }, 400);
    }

    // Clear cache
    try {
      await kv.del('aircraft_list');
    } catch (kvError) {
      console.warn('[Aircraft Routes] Failed to clear KV cache:', kvError);
    }

    console.log(`[Aircraft Routes] Successfully seeded ${data.length} aircraft`);
    return c.json({
      success: true,
      data: data,
      message: `Seeded ${data.length} aircraft successfully`
    }, 201);

  } catch (error) {
    console.error('[Aircraft Routes] Unexpected error:', error);
    return c.json({
      success: false,
      error: 'Server error',
      details: error.message
    }, 500);
  }
});

export default app;