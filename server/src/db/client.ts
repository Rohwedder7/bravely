import dns from "node:dns"
// Supabase no Docker: usar Connection pooler (Transaction) no .env; priorizar IPv4 para evitar ENETUNREACH.
dns.setDefaultResultOrder("ipv4first")

import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import { env } from "../env"

const { Pool } = pg

// Resolve o host para IPv4 (pooler Supabase tem IPv4 e funciona no Docker). Se não houver IPv4, usa a URL original.
const connectionString = await (async () => {
    try {
        const u = new URL(env.DATABASE_URL)
        const host = u.hostname
        if (!host || host === "localhost" || host === "127.0.0.1")
            return env.DATABASE_URL
        const { address } = await dns.promises.lookup(host, { family: 4 })
        u.hostname = address
        return u.toString()
    } catch {
        return env.DATABASE_URL
    }
})()

export const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
})

export const db = drizzle(pool)