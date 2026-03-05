import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(token: string, userId: string): Socket {
  if (!socket) {
    socket = io('/', {
      auth: { token, userId },
      transports: ['websocket'],
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
