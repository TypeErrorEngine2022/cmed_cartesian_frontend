import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure the public directory exists
const publicDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(publicDir)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate a config file with runtime variables
// These will be read from environment variables at build time on Vercel
const config = {
  apiUrl: process.env.VITE_API_URL || 'http://localhost:3001',
  nickname: process.env.VITE_NICKNAME || 'admin'
};

console.log('Generating runtime config with:', JSON.stringify(config));

// Write to a file that will be included in your built assets
fs.writeFileSync(
  path.join(publicDir, 'config.js'),
  `window.RUNTIME_CONFIG = ${JSON.stringify(config, null, 2)};`
);

console.log('Runtime config generated successfully!');
