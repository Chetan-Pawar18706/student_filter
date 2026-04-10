import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'src/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env')
];

let loaded = false;

for (const envPath of candidatePaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    loaded = true;
    break;
  }
}

if (!loaded) {
  dotenv.config();
}
