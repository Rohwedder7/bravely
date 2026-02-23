import fastif from "fastify"
import cors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import { linksRoutes } from "./routes/links"
import { ZodError } from "zod"
import path from "node:path"
import fs from "node:fs"
import { env } from "./env"

export async function createApp() {
  const app = fastif({ logger: true })

  // Aceita POST de formulário HTML (Content-Type: application/x-www-form-urlencoded)
  app.addContentTypeParser("application/x-www-form-urlencoded", (_request, payload, done) => {
    let body = ""
    payload.on("data", (chunk: Buffer) => { body += chunk.toString() })
    payload.on("end", () => { done(null, {}) })
    payload.on("error", (err: Error) => { done(err, undefined) })
  })

  app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Validation error",
        issues: error.format(),
      })
    }

    const errorCode = (error as { code?: string })?.code

    if (errorCode === "23505") {
      return reply.status(409).send({
        message: "Conflict error: Duplicate entry",
      })
    }

    // IMPORTANTE: logue o erro real
    request.log.error({ err: error }, "Unhandled error")

    return reply.status(500).send({
      message: "Internal server error",
    })
  })

  app.register(linksRoutes, { prefix: "/links" })

  // Em produção (Docker), serve apenas /assets/* como estáticos; /links fica com a API; o resto → index.html (SPA)
  if (env.PUBLIC_DIR) {
    const publicDir = path.resolve(process.cwd(), env.PUBLIC_DIR)
    if (fs.existsSync(publicDir)) {
      const assetsDir = path.join(publicDir, "assets")
      if (fs.existsSync(assetsDir)) {
        await app.register(fastifyStatic, {
          root: assetsDir,
          prefix: "/assets/",
        })
      }
      app.setNotFoundHandler((_request, reply) => {
        reply.sendFile("index.html", publicDir)
      })
    }
  }

  return app
}

