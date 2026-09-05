const fs = require('fs');

let code = fs.readFileSync('api/index.ts', 'utf8');

// We need to replace `model: 'gpt-4o-mini'` and `model: 'gpt-4o'`
// with `model: req.body.model || 'gpt-4o-mini'`
code = code.replace(/model:\s*'gpt-4o-mini'/g, "model: req.body.model || 'gpt-4o-mini'");
code = code.replace(/model:\s*'gpt-4o'/g, "model: req.body.model || 'gpt-4o'");

fs.writeFileSync('api/index.ts', code);
