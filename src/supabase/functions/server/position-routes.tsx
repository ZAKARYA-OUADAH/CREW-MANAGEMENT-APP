import { Hono } from 'npm:hono@4.2.7';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const positionRoutes = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// GET /positions - Get all positions
positionRoutes.get('/', async (c) => {
  try {
    console.log('Fetching all positions...');
    
    const { data, error } = await supabase
      .from('position')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching positions:', error);
      return c.json(
        { 
          error: 'Failed to fetch positions', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log(`Successfully fetched ${data?.length || 0} positions`);
    return c.json({ data: data || [] });

  } catch (error) {
    console.error('Unexpected error in GET /positions:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while fetching positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// GET /positions/:id - Get position by ID
positionRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    console.log('Fetching position by ID:', id);

    if (!id) {
      return c.json({ error: 'Position ID is required' }, 400);
    }

    const { data, error } = await supabase
      .from('position')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching position:', error);
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Position not found' }, 404);
      }
      return c.json(
        { 
          error: 'Failed to fetch position', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log('Successfully fetched position:', data);
    return c.json({ data });

  } catch (error) {
    console.error('Unexpected error in GET /positions/:id:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while fetching position',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// POST /positions - Create new position
positionRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Creating new position:', body);

    // Validate required fields
    if (!body.name) {
      return c.json({ error: 'Position name is required' }, 400);
    }

    const positionData = {
      name: body.name,
      code: body.code || null,
      level: body.level || null,
      description: body.description || null,
      requirements: body.requirements || null,
      category: body.category || null,
      active: body.active !== undefined ? body.active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('position')
      .insert([positionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating position:', error);
      return c.json(
        { 
          error: 'Failed to create position', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log('Successfully created position:', data);
    return c.json({ data }, 201);

  } catch (error) {
    console.error('Unexpected error in POST /positions:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while creating position',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// PUT /positions/:id - Update position
positionRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    console.log('Updating position:', id, body);

    if (!id) {
      return c.json({ error: 'Position ID is required' }, 400);
    }

    const updateData = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.code !== undefined && { code: body.code }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.requirements !== undefined && { requirements: body.requirements }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.active !== undefined && { active: body.active }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('position')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating position:', error);
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Position not found' }, 404);
      }
      return c.json(
        { 
          error: 'Failed to update position', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log('Successfully updated position:', data);
    return c.json({ data });

  } catch (error) {
    console.error('Unexpected error in PUT /positions/:id:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while updating position',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// DELETE /positions/:id - Delete position
positionRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    console.log('Deleting position:', id);

    if (!id) {
      return c.json({ error: 'Position ID is required' }, 400);
    }

    const { data, error } = await supabase
      .from('position')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting position:', error);
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Position not found' }, 404);
      }
      return c.json(
        { 
          error: 'Failed to delete position', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log('Successfully deleted position:', data);
    return c.json({ data });

  } catch (error) {
    console.error('Unexpected error in DELETE /positions/:id:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while deleting position',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// GET /positions/active - Get only active positions
positionRoutes.get('/active', async (c) => {
  try {
    console.log('Fetching active positions...');
    
    const { data, error } = await supabase
      .from('position')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching active positions:', error);
      return c.json(
        { 
          error: 'Failed to fetch active positions', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log(`Successfully fetched ${data?.length || 0} active positions`);
    return c.json({ data: data || [] });

  } catch (error) {
    console.error('Unexpected error in GET /positions/active:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while fetching active positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

// GET /positions/category/:category - Get positions by category
positionRoutes.get('/category/:category', async (c) => {
  try {
    const category = c.req.param('category');
    console.log('Fetching positions by category:', category);

    if (!category) {
      return c.json({ error: 'Category is required' }, 400);
    }

    const { data, error } = await supabase
      .from('position')
      .select('*')
      .eq('category', category)
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching positions by category:', error);
      return c.json(
        { 
          error: 'Failed to fetch positions by category', 
          details: error.message,
          code: error.code 
        },
        500
      );
    }

    console.log(`Successfully fetched ${data?.length || 0} positions for category: ${category}`);
    return c.json({ data: data || [] });

  } catch (error) {
    console.error('Unexpected error in GET /positions/category/:category:', error);
    return c.json(
      { 
        error: 'Unexpected error occurred while fetching positions by category',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      500
    );
  }
});

export default positionRoutes;