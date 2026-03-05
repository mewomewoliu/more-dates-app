import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthedRequest } from '../middleware/clerkAuth'

const router = Router({ mergeParams: true })

// POST /api/plans/:planId/locations
router.post('/', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { planId } = req.params
  const { name, meta, emoji, gradientFrom, gradientTo } = req.body as {
    name: string
    meta?: string
    emoji?: string
    gradientFrom?: string
    gradientTo?: string
  }

  if (!name?.trim()) {
    res.status(400).json({ error: 'Name is required' })
    return
  }

  const member = await prisma.planMember.findFirst({ where: { planId, userId } })
  if (!member) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const location = await prisma.location.create({
    data: {
      planId,
      name,
      meta,
      emoji: emoji ?? '📍',
      gradientFrom: gradientFrom ?? '#E8956D',
      gradientTo: gradientTo ?? '#C4622D',
      addedById: userId,
    },
    include: { addedBy: true, votes: { include: { user: true } } },
  })

  await prisma.feedItem.create({
    data: { planId, userId, action: 'added_location', details: JSON.stringify({ name }) },
  })

  res.status(201).json(location)
})

// DELETE /api/plans/:planId/locations/:id
router.delete('/:id', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { id } = req.params

  const location = await prisma.location.findFirst({
    where: { id, addedById: userId },
  })
  if (!location) {
    res.status(404).json({ error: 'Not found or not yours' })
    return
  }

  await prisma.location.delete({ where: { id } })
  res.status(204).send()
})

export default router
