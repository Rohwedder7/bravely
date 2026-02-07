import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { db } from "../db/client.js"
import { links } from "../db/schema.js"
import { and, desc, eq, lt, ilike, sql, or } from "drizzle-orm"
import { nanoid } from "nanoid"
import { generateLinksCsvBuffer } from "../services/export-links-csv.js"

const shortUrlSchema = z.string().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/, "Short URL can only contain letters, numbers, hyphens, and underscores.")

export async function linksRoutes(app: FastifyInstance) {
    app.post("/", async (request, reply) => {
        const bodySchema = z.object({
            originalUrl: z.string().url(),
            customShortUrl: shortUrlSchema,
        })

        const { originalUrl, customShortUrl } = bodySchema.parse(request.body)

        const [created] = await db.insert(links).values({
            originalUrl,
            shortUrl: customShortUrl ?? nanoid(8),
        }).returning()
        
        return reply.status(201).send(created)
    })

    app.delete("/:id", async (request, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid(),
        })

        const { id } = paramsSchema.parse(request.params)

        const deleted = await db.delete(links).where(eq(links.id, id)).returning()

        if (deleted.length === 0) {
            return reply.status(404).send({ message: "Link not found." })
        }

        return reply.status(204).send()

    })

    app.get("/resolve/:shortUrl", async (request, reply) => {
        const paramsSchema = z.object({
            shortUrl: shortUrlSchema,
        })

        const { shortUrl } = paramsSchema.parse(request.params)

        const [link] = await db.select().from(links).where(eq(links.shortUrl, shortUrl)).limit(1)

        if (!link) {
            return reply.status(404).send({ message: "Link not found." })
        }

        const [updated] = await db.update(links).set({
            visits: sql`${links.visits} + 1`,
        }).where(eq(links.id, link.id)).returning()

        return reply.send(updated)
    })

    app.get("/", async (request) => {
        const querySchema = z.object({
            limit: z.coerce.number().min(1).max(100).default(20),
            cursorCreatedAt: z.string().optional(),
            cursorId: z.string().uuid().optional(),
            search: z.string().optional(),
        })

        const { limit, cursorCreatedAt, cursorId, search } = querySchema.parse(request.query)

        const conditions = []
        
        if (search) {
            conditions.push(or(
                ilike(links.originalUrl, `%${search}%`),
                ilike(links.shortUrl, `%${search}%`),
            ))
        }

        if (cursorCreatedAt && cursorId) {
            conditions.push(or(
                lt(links.createdAt, new Date(cursorCreatedAt)),
                and(
                    eq(links.createdAt, new Date(cursorCreatedAt)),
                    lt(links.id, cursorId),
                ),
            ))
        }

        const rows = await db.select().from(links)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(links.createdAt), desc(links.id))
            .limit(limit + 1)

        const hasMore = rows.length > limit
        const linksData = hasMore ? rows.slice(0, limit) : rows

        const nextCursor = hasMore ? {
            cursorCreatedAt: linksData[linksData.length - 1].createdAt.toISOString(),
            cursorId: linksData[linksData.length - 1].id,
        } : null

        return {
            links: linksData,
            nextCursor,
        }
    })

    app.post("/export", async (request, reply) => {
        const filename = `links_${Date.now()}.csv`
        const buffer = await generateLinksCsvBuffer()
        return reply
            .header("Content-Type", "text/csv; charset=utf-8")
            .header("Content-Disposition", `attachment; filename="${filename}"`)
            .send(buffer)
    })

}
