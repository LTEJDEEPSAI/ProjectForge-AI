import express from 'express';
import apiRouter from '../src/apiRouter';

const app = express();
app.use(express.json());

// Vercel routes everything in /api to here, so we mount the router at /api
// But actually if vercel.json rewrites /api/(.*) to /api/index, the request path will still be /api/generate-projects
app.use('/api', apiRouter);

export default app;
