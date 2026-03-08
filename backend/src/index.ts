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

// Allow the configured frontend URL plus any Vercel preview deployment URLs
function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false
  if (origin === FRONTEND_URL) return true
  if (origin === 'http://localhost:5173' || origin === 'http://localhost:5174') return true
  // Allow all *.vercel.app preview URLs for the same project
  if (/^https:\/\/more-dates-app[^.]*\.vercel\.app$/.test(origin)) return true
  return false
}

const corsOptions = { origin: isAllowedOrigin, credentials: true }

const io = new Server(httpServer, { cors: corsOptions })

app.use(cors(corsOptions))
app.use(express.json())
app.use(clerkMiddleware())

app.use('/api', router)

setupSocketHandlers(io)
setIo(io)

const PORT = parseInt(process.env.PORT ?? '3001', 10)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
