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
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
