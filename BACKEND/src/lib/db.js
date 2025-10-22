import mongoose from 'mongoose';

let cachedConnection = null;

export async function connectDB() {
  if (cachedConnection) {
    console.log('✓ Using cached MongoDB connection');
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    cachedConnection = conn;
    console.log(`✓ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('✓ MongoDB disconnected');
  }
}

export function getDB() {
  if (!cachedConnection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return cachedConnection;
}
