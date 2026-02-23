import { createApp } from "./app"
import { env } from "./env"
import { pool } from "./db/client"

// Diagnóstico: mostra o host do banco (evita surpresa com "base" por .env quebrado)
try {
    const dbUrl = new URL(env.DATABASE_URL)
    console.log(`Database host: ${dbUrl.hostname}`)
} catch {
    console.warn("DATABASE_URL não é uma URL válida")
}

// Testa conexão com o banco na subida
pool.query("SELECT 1")
    .then(() => console.log("Database: conexão OK"))
    .catch((err: Error) => {
        console.error("Database: falha na conexão. Verifique DATABASE_URL no .env (uma única linha, URL do Supabase em Settings > Database > Connection string). Erro:", err.message)
    })

const app = await createApp()

app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
})