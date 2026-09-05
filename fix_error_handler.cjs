const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace(
  /message: err\.message \|\| 'Internal server error'/g,
  "message: 'Internal server error'"
);

fs.writeFileSync('api/index.ts', code);
