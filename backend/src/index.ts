// Load .env before any imports initialise (tsx compiles to CJS so this runs first)
try { (process as any).loadEnvFile?.('.env') } catch {}

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import router from './routes'
import { setupSocketHandlers, setIo } from './socket'

const app = express()
const httpServer = createServer(app)

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true },
})

app.use(cors({ origin: FRONTEND_URL, credentials: true }))
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api', router)

setupSocketHandlers(io)
setIo(io)

const PORT = parseInt(process.env.PORT ?? '3001', 10)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
