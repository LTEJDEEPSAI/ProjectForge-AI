const fs = require('fs');

let apiCode = fs.readFileSync('api/index.ts', 'utf8');
if (!apiCode.includes('export { apiRouter }')) {
  apiCode = apiCode.replace('export default app;', 'export { apiRouter };\nexport default app;');
  fs.writeFileSync('api/index.ts', apiCode);
}

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace("import apiApp from './api/index';", "import { apiRouter } from './api/index';");
serverCode = serverCode.replace("app.use(apiApp);", "app.use('/api', apiRouter);");
fs.writeFileSync('server.ts', serverCode);
