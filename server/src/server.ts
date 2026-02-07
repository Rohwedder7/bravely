import { createApp } from "./app.js"
import { env } from "./env.js"

const app = createApp()

app.listen({ port: env.PORT, host: "0.0.0.0" }).then(() => {
    console.log(`Server is running on http://localhost:${env.PORT}`)
})