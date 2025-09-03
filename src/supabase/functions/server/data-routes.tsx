import { Hono } from "npm:hono";
import { requireAuth } from "./middleware.tsx";
import * as kv from "./kv_store.tsx";

const dataRoutes = new Hono();

// KV Store operations
dataRoutes.post('/kv/set', requireAuth, async (c) => {
  try {
    const { key, value } = await c.req.json();
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (error) {
    console.error('KV Set error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.get('/kv/get', requireAuth, async (c) => {
  try {
    const key = c.req.query('key');
    if (!key) {
      return c.json({ success: false, error: 'Key parameter required' }, 400);
    }
    
    const value = await kv.get(key);
    return c.json({ success: true, data: value });
  } catch (error) {
    console.error('KV Get error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.delete('/kv/delete', requireAuth, async (c) => {
  try {
    const { key } = await c.req.json();
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.error('KV Delete error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.post('/kv/mset', requireAuth, async (c) => {
  try {
    const { items } = await c.req.json();
    const keys = items.map(item => item.key);
    const values = items.map(item => item.value);
    await kv.mset(keys, values);
    return c.json({ success: true });
  } catch (error) {
    console.error('KV MSet error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.post('/kv/mget', requireAuth, async (c) => {
  try {
    const { keys } = await c.req.json();
    const values = await kv.mget(keys);
    return c.json({ success: true, data: values });
  } catch (error) {
    console.error('KV MGet error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.delete('/kv/mdel', requireAuth, async (c) => {
  try {
    const { keys } = await c.req.json();
    await kv.mdel(keys);
    return c.json({ success: true });
  } catch (error) {
    console.error('KV MDelete error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.get('/kv/search', requireAuth, async (c) => {
  try {
    const prefix = c.req.query('prefix');
    if (!prefix) {
      return c.json({ success: false, error: 'Prefix parameter required' }, 400);
    }
    
    const values = await kv.getByPrefix(prefix);
    return c.json({ success: true, data: values });
  } catch (error) {
    console.error('KV Search error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.get('/kv/stats', requireAuth, async (c) => {
  try {
    // Get statistics about the KV store
    const missions = await kv.getByPrefix('crewtech:missions:');
    const crew = await kv.getByPrefix('crewtech:crew:');
    const notifications = await kv.getByPrefix('crewtech:notifications:');
    const activities = await kv.getByPrefix('crewtech:activities:');
    
    const stats = {
      total_keys: missions.length + crew.length + notifications.length + activities.length,
      total_size: JSON.stringify({missions, crew, notifications, activities}).length,
      prefixes: {
        'crewtech:missions': missions.length,
        'crewtech:crew': crew.length,
        'crewtech:notifications': notifications.length,
        'crewtech:activities': activities.length,
      }
    };
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('KV Stats error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.delete('/kv/clear', requireAuth, async (c) => {
  try {
    const prefix = c.req.query('prefix');
    
    if (prefix) {
      // Clear specific prefix
      const keys = await kv.getByPrefix(prefix);
      if (keys.length > 0) {
        await kv.mdel(keys.map((_, index) => `${prefix}${index}`));
      }
    } else {
      // Clear all CrewTech data (development only)
      const prefixes = ['crewtech:missions:', 'crewtech:crew:', 'crewtech:notifications:', 'crewtech:activities:'];
      for (const prefix of prefixes) {
        const items = await kv.getByPrefix(prefix);
        if (items.length > 0) {
          console.log(`Clearing ${items.length} items with prefix ${prefix}`);
        }
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('KV Clear error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

dataRoutes.get('/kv/ping', (c) => {
  return c.json({ success: true, message: 'KV Store is accessible' });
});

// Data synchronization endpoint
dataRoutes.get('/sync', requireAuth, async (c) => {
  try {
    // Get all application data
    const missions = await kv.getByPrefix('crewtech:missions:');
    const crew = await kv.getByPrefix('crewtech:crew:');
    const notifications = await kv.getByPrefix('crewtech:notifications:');
    const activities = await kv.getByPrefix('crewtech:activities:');
    
    // Sort activities by date (newest first)
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 100); // Limit to 100 most recent
    
    return c.json({
      success: true,
      data: {
        missions,
        crew,
        notifications,
        activities: sortedActivities,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Bulk data import (for seeding)
dataRoutes.post('/import', requireAuth, async (c) => {
  try {
    const { missions, crew, notifications, activities } = await c.req.json();
    
    // Import missions
    if (missions && Array.isArray(missions)) {
      for (const mission of missions) {
        await kv.set(`crewtech:missions:${mission.id}`, mission);
      }
    }
    
    // Import crew
    if (crew && Array.isArray(crew)) {
      for (const member of crew) {
        await kv.set(`crewtech:crew:${member.id}`, member);
      }
    }
    
    // Import notifications
    if (notifications && Array.isArray(notifications)) {
      for (const notification of notifications) {
        await kv.set(`crewtech:notifications:${notification.id}`, notification);
      }
    }
    
    // Import activities
    if (activities && Array.isArray(activities)) {
      for (const activity of activities) {
        await kv.set(`crewtech:activities:${activity.id}`, activity);
      }
    }
    
    return c.json({
      success: true,
      imported: {
        missions: missions?.length || 0,
        crew: crew?.length || 0,
        notifications: notifications?.length || 0,
        activities: activities?.length || 0,
      }
    });
  } catch (error) {
    console.error('Import error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Get all data
dataRoutes.get('/all', requireAuth, async (c) => {
  try {
    const missions = await kv.getByPrefix('crewtech:missions:');
    const crew = await kv.getByPrefix('crewtech:crew:');
    const notifications = await kv.getByPrefix('crewtech:notifications:');
    const activities = await kv.getByPrefix('crewtech:activities:');
    
    return c.json({
      success: true,
      data: {
        missions,
        crew,
        notifications,
        activities
      }
    });
  } catch (error) {
    console.error('Error fetching all data:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Aircraft data endpoint - Real data from KV store
dataRoutes.get("/aircraft", requireAuth, async (c) => {
  try {
    const aircraft = await kv.getByPrefix('crewtech:aircraft:');
    return c.json({ success: true, data: aircraft });
  } catch (error) {
    console.error('Error fetching aircraft:', error);
    return c.json({ success: false, error: 'Failed to fetch aircraft' }, 500);
  }
});

// Flight data endpoint - Real data from KV store
dataRoutes.get("/flights", requireAuth, async (c) => {
  try {
    const flights = await kv.getByPrefix('crewtech:flights:');
    return c.json({ success: true, data: flights });
  } catch (error) {
    console.error('Error fetching flights:', error);
    return c.json({ success: false, error: 'Failed to fetch flights' }, 500);
  }
});

export default dataRoutes;