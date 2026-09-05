const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace(
  "app.use(express.json());",
  "app.use(express.json({ limit: '1mb' }));"
);

fs.writeFileSync('api/index.ts', code);
