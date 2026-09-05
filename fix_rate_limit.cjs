const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const importRateLimit = `import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests from this IP, please try again after 15 minutes' } }
});
`;

code = code.replace("const app = express();", importRateLimit + "\nconst app = express();\napp.use('/api', apiLimiter);");

fs.writeFileSync('api/index.ts', code);
