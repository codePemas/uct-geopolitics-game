import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Please define the DATABASE_URL environment variable inside .env.local");
}

export const sql = neon(DATABASE_URL);

// Compatibility export so existing files importing connectToDatabase don't break
export async function connectToDatabase() {
  return sql;
}