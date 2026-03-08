import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthedRequest } from '../middleware/clerkAuth'

const router = Router()

// GET /api/me — current user profile
router.get('/me', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }
  res.json(user)
})

// PATCH /api/me — update display name
router.patch('/me', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { name } = req.body as { name?: string }
  if (!name?.trim()) { res.status(400).json({ error: 'Name is required' }); return }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  })
  res.json(user)
})

export default router
