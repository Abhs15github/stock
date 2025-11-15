import mongoose from 'mongoose';

const DEFAULT_URI =
  'mongodb+srv://abhitam33_db_user:gdndAVijei64DHgw@cluster0.sn35sbd.mongodb.net/?appName=Cluster0';

const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

interface GlobalMongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: GlobalMongooseCache | undefined;
}

const globalCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

global.mongooseCache = globalCache;

export async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}

