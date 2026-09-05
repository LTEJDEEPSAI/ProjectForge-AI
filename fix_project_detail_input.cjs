const fs = require('fs');
let code = fs.readFileSync('src/pages/ProjectDetail.tsx', 'utf8');

code = code.replace(
  /type="text"\s*value={chatInput}/g,
  'type="text"\n                aria-label="Chat input"\n                value={chatInput}'
);

fs.writeFileSync('src/pages/ProjectDetail.tsx', code);
