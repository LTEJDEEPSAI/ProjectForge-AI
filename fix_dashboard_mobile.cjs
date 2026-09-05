const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /<div className="flex justify-between items-end mb-8">/g,
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
