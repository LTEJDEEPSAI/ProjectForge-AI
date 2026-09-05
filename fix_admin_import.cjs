const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

code = code.replace("import * as admin from 'firebase-admin';", "import { getApps, initializeApp } from 'firebase-admin/app';\nimport { getAuth } from 'firebase-admin/auth';");
code = code.replace("!admin.apps.length", "!getApps().length");
code = code.replace("admin.initializeApp(", "initializeApp(");
code = code.replace("await admin.auth().verifyIdToken(", "await getAuth().verifyIdToken(");

fs.writeFileSync('api/index.ts', code);
