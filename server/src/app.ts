import fastif from "fastify"
import cors from "@fastify/cors"
import { linksRoutes } from "./routes/links.js"
import { ZodError } from "zod"

export function createApp() {
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

  return app
}

