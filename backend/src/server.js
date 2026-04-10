import { app } from './app.js';
import connectDatabase from './config/db.js';
import { User } from './models/User.js';

const port = Number(process.env.PORT) || 5000;

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.warn('Admin bootstrap skipped: ADMIN_NAME, ADMIN_EMAIL, or ADMIN_PASSWORD missing.');
    return;
  }

  const existingAdmin = await User.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    return;
  }

  await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: 'admin'
  });

  console.log('Admin user bootstrapped');
}

async function startServer() {
  await connectDatabase();
  await ensureAdminUser();
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
