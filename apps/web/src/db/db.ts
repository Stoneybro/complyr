import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

// Configure WebSocket for serverless environments (Node.js)
// eslint-disable-next-line @typescript-eslint/no-require-imports
neonConfig.webSocketConstructor = require("ws");

// Use global singleton to prevent exhausting connections in dev
const globalForDb = globalThis as unknown as {
    pool: Pool | undefined;
};

const pool =
    globalForDb.pool ??
    new Pool({
        connectionString: process.env.COMPLYR_DATABASE_URL!,
        connectionTimeoutMillis: 10000, // 10 seconds - helps with cold starts
        max: 10, // max connections in pool
    });

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });