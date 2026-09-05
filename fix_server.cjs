const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');
serverCode = serverCode.replace("import app from './api/index';", "import apiApp from './api/index';");
serverCode = serverCode.replace("app.use('/api', apiRouter);", "app.use(apiApp);");
fs.writeFileSync('server.ts', serverCode);

