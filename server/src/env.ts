import { z } from 'zod'
import 'dotenv/config'

export const envSchema = z.object({
    PORT: z.coerce.number().default(3333),
    DATABASE_URL: z.string().url(),
    // Cloudflare R2: opcionais; só necessários se usar upload de CSV para R2 (a rota atual devolve o CSV direto)
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1).optional(),
    CLOUDFLARE_ACCESS_KEY_ID: z.string().min(1).optional(),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    CLOUDFLARE_BUCKET: z.string().min(1).optional(),
    CLOUDFLARE_PUBLIC_URL: z.string().url().optional(),
})

export const env = envSchema.parse(process.env)