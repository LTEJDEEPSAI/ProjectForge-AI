import express from 'express';
import apiRouter from '../src/apiRouter';

const app = express();
app.use(express.json());

// Vercel rewrites might pass /api/generate-projects or /generate-projects
// Mount on both to be safe
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch 404 to ensure we return JSON instead of Express HTML 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `API route ${req.url} not found` } });
});

// Global Error Handler to ensure we return JSON instead of Express HTML 500
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled Express Error:', err);
  // Ensure we don't return HTML
  res.status(err.status || 500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: err.message || 'Internal server error' 
    } 
  });
});

export default app;
