import dns from "node:dns"
// Dentro do Docker a rede muitas vezes não tem IPv6; forçar IPv4 evita ENETUNREACH
dns.setDefaultResultOrder("ipv4first")

import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import "dotenv/config"

const { Pool } = pg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
})

export const db = drizzle(pool)