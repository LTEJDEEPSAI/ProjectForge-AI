const fs = require('fs');

let code = fs.readFileSync('src/utils/api.ts', 'utf8');

if (!code.includes('import { auth } from "../firebase";')) {
  code = `import { auth } from "../firebase";\n` + code;
}

const tokenCode = `
  let token = '';
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }
`;

if (!code.includes('let token =')) {
  code = code.replace(
    `let modifiedOptions = { ...options };`,
    `${tokenCode}\n  let modifiedOptions = { ...options };`
  );

  code = code.replace(
    `'Content-Type': 'application/json',`,
    `'Content-Type': 'application/json',\n      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),`
  );
}

fs.writeFileSync('src/utils/api.ts', code);
