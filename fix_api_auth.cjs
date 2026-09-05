const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

const adminImport = `import admin from 'firebase-admin';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

// Authentication Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized: Missing or invalid token', code: 'UNAUTHORIZED' } });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ success: false, error: { message: 'Unauthorized: Invalid token', code: 'UNAUTHORIZED' } });
  }
};
`;

code = code.replace("import express from 'express';", "import express from 'express';\n" + adminImport);

// Inject authenticateToken into all apiRouter routes
code = code.replace(/apiRouter.post\('\/generate-projects', async \(req, res\) => {/g, "apiRouter.post('/generate-projects', authenticateToken, async (req: any, res: any) => {\n    if (!req.body.profile) return res.status(400).json({ success: false, error: 'Missing profile' });");
code = code.replace(/apiRouter.post\('\/evaluate-project', async \(req, res\) => {/g, "apiRouter.post('/evaluate-project', authenticateToken, async (req: any, res: any) => {\n    if (!req.body.project || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });");
code = code.replace(/apiRouter.post\('\/generate-blueprint', async \(req, res\) => {/g, "apiRouter.post('/generate-blueprint', authenticateToken, async (req: any, res: any) => {\n    if (!req.body.project || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });");
code = code.replace(/apiRouter.post\('\/mentor-chat', async \(req, res\) => {/g, "apiRouter.post('/mentor-chat', authenticateToken, async (req: any, res: any) => {\n    if (!req.body.message || !req.body.history || !req.body.projectContext || !req.body.profile) return res.status(400).json({ success: false, error: 'Missing data' });");
code = code.replace(/apiRouter.post\('\/improve-project', async \(req, res\) => {/g, "apiRouter.post('/improve-project', authenticateToken, async (req: any, res: any) => {\n    if (!req.body.description) return res.status(400).json({ success: false, error: 'Missing description' });");

fs.writeFileSync('api/index.ts', code);
