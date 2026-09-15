/**
 * Visual Vault - Database Configuration
 * Connects to MongoDB Atlas via Mongoose. MONGODB_URI is required —
 * there is no in-memory fallback, so the app always talks to a real database.
 */

import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add your MongoDB Atlas connection string to .env before starting the server.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Visual Vault: Connected to MongoDB Atlas successfully.');

};

