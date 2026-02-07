import { uuid, text, integer, timestamp, uniqueIndex, index, pgTable } from "drizzle-orm/pg-core"

export const links = pgTable("links", {

    id: uuid("id").defaultRandom().primaryKey(),
    originalUrl: text('original_url').notNull(),
    shortUrl: text('short_url').notNull(),
    visits: integer('visits').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    
}, (table) => ({
    shortUrlUnique: uniqueIndex('links_short_url_unique').on(table.shortUrl),
    createdAtIdx: index('links_created_at_idx').on(table.createdAt),
}))