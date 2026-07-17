import { MongoClient, ServerApiVersion } from "mongodb";

let client;
let db;

function getConfig() {
  return {
    uri:
      process.env.MONGO_URI ||
      "mongodb://mongodb:27017/employees?directConnection=true",
    dbName: process.env.MONGODB_DB_NAME || "employees",
  };
}

function createClient(uri) {
  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

export async function connectToDatabase() {
  if (db) {
    return db;
  }

  const { uri, dbName } = getConfig();
  client = createClient(uri);
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  console.log("Successfully connected to MongoDB");
  db = client.db(dbName);
  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToDatabase() first.");
  }
  return db;
}

export default getDb;
