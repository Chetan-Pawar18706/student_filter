import dotenv from 'dotenv';
import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';

dotenv.config();

async function seedAdmin() {
  await connectDatabase();

  const email = process.env.ADMIN_EMAIL;
  if (!email || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_NAME) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD are required in .env');
  }

  const existingAdmin = await User.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    console.log('Admin already exists');
    process.exit(0);
  }

  await User.create({
    name: process.env.ADMIN_NAME,
    email: email.toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    role: 'admin'
  });

  console.log('Admin user created');
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
