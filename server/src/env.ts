import { z } from 'zod'
import path from 'node:path'
import { config } from 'dotenv'

// Carrega .env do diretório do server e da raiz do monorepo
config({ path: path.resolve(process.cwd(), '.env') })
config({ path: path.resolve(process.cwd(), '..', '.env') })

/** Remove quebras de linha, \\r e aspas em volta (evita host "base" quando a URL foi quebrada no .env). */
function normalizeDatabaseUrl(val: unknown): string {
    if (typeof val !== 'string') return ''
    return val
        .trim()
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/^["']|["']$/g, '')
}

export const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.preprocess(
        normalizeDatabaseUrl,
        z.string().min(1, 'DATABASE_URL é obrigatória').url('DATABASE_URL deve ser uma URL válida (ex.: postgresql://user:senha@host:5432/db)')
    ).refine(
        (url) => {
            try {
                const host = new URL(url).hostname?.toLowerCase() ?? ''
                return host !== 'base' && host !== 'host' && host.length > 3
            } catch {
                return true
            }
        },
        { message: 'DATABASE_URL está com host inválido ("base" ou quebrada em duas linhas no .env). No .env use UMA ÚNICA LINHA. Supabase: copie a "Connection string" em Project Settings > Database (modo Transaction).' }
    ),
    /** Diretório dos arquivos estáticos do frontend (ex.: /app/server/public). Quando definido, a API serve o SPA. */
    PUBLIC_DIR: z.string().min(1).optional(),
    // Cloudflare R2: opcionais; só necessários se usar upload de CSV para R2 (a rota atual devolve o CSV direto)
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
    CLOUDFLARE_ACCESS_KEY_ID: z.string().min(1).optional(),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    CLOUDFLARE_BUCKET: z.string().min(1).optional(),
    CLOUDFLARE_PUBLIC_URL: z.preprocess(
        (v) => {
            if (v === '' || v === undefined || v === null) return undefined
            const s = String(v).trim().replace(/^["']|["']$/g, '')
            if (!s) return undefined
            try {
                new URL(s)
                return s
            } catch {
                return undefined
            }
        },
        z.string().url().optional()
    ),
})

export const env = envSchema.parse(process.env)