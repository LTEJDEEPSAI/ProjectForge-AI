const fs = require('fs');
let code = fs.readFileSync('src/__tests__/integration.test.tsx', 'utf8');

code = "import '@testing-library/jest-dom';\n" + code;
code = code.replace(/import \{ ImproveProject \} from '\.\.\/pages\/ImproveProject';\n/, "");
code = code.replace(/const mockGetDocs = /g, "");

fs.writeFileSync('src/__tests__/integration.test.tsx', code);
