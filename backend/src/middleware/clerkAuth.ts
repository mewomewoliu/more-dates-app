import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from '../lib/prisma'

export interface AuthedRequest extends Request {
  userId: string
  userDbId: string
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = getAuth(req)

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Upsert user into DB on first authenticated request
  try {
    const clerkUser = await clerkClient.users.getUser(userId)
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? ''
    const name =
      `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() ||
      email.split('@')[0]

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email, name },
      update: { email, name },
    })

    ;(req as AuthedRequest).userId = userId
    ;(req as AuthedRequest).userDbId = userId
    next()
  } catch (err) {
    console.error('[requireAuth] error:', err)
    res.status(500).json({ error: 'Auth sync failed', detail: String(err) })
  }
}
