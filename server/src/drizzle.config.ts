import { defineConfig } from "drizzle-kit";
import { env } from "./env.js";

export default defineConfig({
    dialect: 'postgresql',
    schema: './server/src/db/schema.ts',
    out: './server/src/db/migrations',
    dbCredentials: {
        url: env.DATABASE_URL,
    },
})