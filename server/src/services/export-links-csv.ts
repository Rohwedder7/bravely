import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { format } from "fast-csv"
import { PassThrough } from "node:stream"
import { env } from "../env.js"
import { db } from "../db/client.js"
import { links } from "../db/schema.js"
import { desc } from "drizzle-orm"

function getR2Client() {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_ACCESS_KEY_ID ||
        !env.CLOUDFLARE_SECRET_ACCESS_KEY) {
        throw new Error("Cloudflare R2 credentials are not set in environment variables.")
    }

    return new S3Client({
        region: "auto",
        endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
            secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
        },
    })
}

/** Gera o CSV em memória e retorna o buffer (para resposta direta ou upload). */
export async function generateLinksCsvBuffer(): Promise<Buffer> {
    const rows = await db.select().from(links).orderBy(desc(links.createdAt))

    const pass = new PassThrough()
    const chunks: Buffer[] = []
    pass.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    const csvStream = format({ headers: ["Original URL", "Short URL", "Created At", "Visits"] })
    csvStream.pipe(pass)

    for (const row of rows) {
        csvStream.write([row.originalUrl, row.shortUrl, row.createdAt.toISOString(), row.visits])
    }
    csvStream.end()

    await new Promise<void>((resolve, reject) => {
        pass.on("end", resolve)
        pass.on("error", reject)
    })

    return Buffer.concat(chunks)
}

export async function exportLinksToCSV(filename: string) {
    if (!env.CLOUDFLARE_BUCKET || !env.CLOUDFLARE_PUBLIC_URL) {
        throw new Error("Cloudflare R2 bucket name or public URL is not set in environment variables.")
    }

    const body = await generateLinksCsvBuffer()
    const client = getR2Client()

    await client.send(new PutObjectCommand({
        Bucket: env.CLOUDFLARE_BUCKET,
        Key: filename,
        Body: body,
        ContentType: "text/csv; charset=utf-8",
        ContentLength: body.length,
    }))

    const publicBase = env.CLOUDFLARE_PUBLIC_URL.replace(/\/+$/, '')
    return `${publicBase}/${filename}`
}

