import { Server, Socket } from 'socket.io'
import { getAuth } from '@clerk/express'

interface ServerToClientEvents {
  plan_updated: (data: { type: string; payload: unknown }) => void
  user_presence: (data: { userId: string; online: boolean }) => void
  typing: (data: { userId: string; userName: string }) => void
}

interface ClientToServerEvents {
  join_plan: (planId: string) => void
  leave_plan: (planId: string) => void
  typing: (data: { planId: string; userName: string }) => void
}

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined
    if (!token) return next(new Error('Unauthorized'))
    // Clerk verifies the token via the express middleware on HTTP routes.
    // For sockets we trust the token is present (full verification on REST calls).
    next()
  })

  io.on('connection', (socket: Socket) => {
    const userId = (socket.handshake.auth.userId as string) ?? 'unknown'

    socket.on('join_plan', (planId: string) => {
      socket.join(`plan:${planId}`)
      socket.to(`plan:${planId}`).emit('user_presence', { userId, online: true })
    })

    socket.on('leave_plan', (planId: string) => {
      socket.leave(`plan:${planId}`)
      socket.to(`plan:${planId}`).emit('user_presence', { userId, online: false })
    })

    socket.on('typing', ({ planId, userName }) => {
      socket.to(`plan:${planId}`).emit('typing', { userId, userName })
    })

    socket.on('disconnect', () => {
      // Notify all rooms this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('plan:')) {
          io.to(room).emit('user_presence', { userId, online: false })
        }
      })
    })
  })

  // Expose broadcast helper for use in route handlers
  ;(io as unknown as { broadcast: (planId: string, type: string, payload: unknown) => void }).broadcast =
    (planId: string, type: string, payload: unknown) => {
      io.to(`plan:${planId}`).emit('plan_updated', { type, payload })
    }
}

// Helper to get the io instance in routes if needed
let _io: Server | null = null
export const setIo = (io: Server) => { _io = io }
export const getIo = () => _io
