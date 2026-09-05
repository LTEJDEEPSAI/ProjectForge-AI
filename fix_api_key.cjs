const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace(
  /apiKey:\s*'sk-[a-zA-Z0-9]+',/,
  "apiKey: process.env.CHATANYWHERE_API_KEY || 'sk-ACQOvugnS4x9a1cVCBmDYVDDWDbAQzVwDMGy6WQM2ZQfM5xy',"
);

fs.writeFileSync('api/index.ts', code);
