import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { supabase, supabaseAdmin } from './config/supabase';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', process.env.FRONTEND_URL || 'http://localhost:8080'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Combined status endpoint for frontend
app.get('/api/status', async (req, res) => {
  const backendStatus = 'running';
  let databaseStatus = 'disconnected';
  
  try {
    const { error } = await supabase.auth.getSession();
    if (!error) {
      databaseStatus = 'running';
    }
  } catch (error) {
    databaseStatus = 'error';
  }
  
  res.json({
    backend: {
      status: backendStatus,
      message: 'backend is running on frontend',
      timestamp: new Date().toISOString()
    },
    database: {
      status: databaseStatus,
      message: databaseStatus === 'running' 
        ? 'database is running with the backend and frontend' 
        : 'database is not connected',
      timestamp: new Date().toISOString()
    }
  });
});

// Supabase connection test endpoint
app.get('/health/supabase', async (req, res) => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    res.json({ 
      status: 'OK', 
      message: 'Supabase connected successfully',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('Supabase connection error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Failed to connect to Supabase',
      error: error.message || error.code || JSON.stringify(error),
      details: {
        url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        hasAnonKey: process.env.SUPABASE_ANON_KEY ? 'Yes' : 'No',
        hasServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'
      }
    });
  }
});

// API routes
import apiRoutes from './routes';
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Check Supabase connection on startup
async function checkSupabaseConnection() {
  try {
    // Check if Supabase env vars are set
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('Checking Supabase config...');
    console.log('  URL:', supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : '❌ MISSING');
    console.log('  KEY:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : '❌ MISSING');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase environment variables not set!');
      console.error('   Please check your backend/.env file');
      return false;
    }
    
    console.log('  Testing database connection...');
    
    // Try a simple health check first
    const { data: healthData, error: healthError } = await supabase.auth.getSession();
    if (healthError) {
      console.error('❌ Supabase auth check failed:', healthError.message);
    } else {
      console.log('  ✅ Supabase auth is reachable');
    }
    
    // Try to query users table (this may fail due to RLS without a logged-in user)
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.warn('⚠️  Users table query failed (likely RLS - this is OK for anon key):', error.message || 'No message');
      console.warn('   This is expected if RLS policies restrict anon access');
    } else {
      console.log('  ✅ Users table is accessible');
    }
    
    console.log('✅ Supabase database connected successfully!');
    return true;
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err.message || err);
    return false;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check database connection after a short delay to ensure it appears last
  setTimeout(() => {
    checkSupabaseConnection();
  }, 100);
});
