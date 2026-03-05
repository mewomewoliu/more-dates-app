import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthedRequest } from '../middleware/clerkAuth'

const router = Router({ mergeParams: true })

// POST /api/plans/:planId/activities
router.post('/', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { planId } = req.params
  const { name, emoji, category } = req.body as {
    name: string
    emoji?: string
    category?: string
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

  const activity = await prisma.activity.create({
    data: {
      planId,
      name,
      emoji: emoji ?? '✨',
      category: category ?? 'fun',
      addedById: userId,
    },
    include: { addedBy: true, votes: { include: { user: true } } },
  })

  await prisma.feedItem.create({
    data: { planId, userId, action: 'added_activity', details: JSON.stringify({ name }) },
  })

  res.status(201).json(activity)
})

// PATCH /api/plans/:planId/activities/:id — toggle checked
router.patch('/:id', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { planId, id } = req.params
  const { checked } = req.body as { checked: boolean }

  const member = await prisma.planMember.findFirst({ where: { planId, userId } })
  if (!member) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const activity = await prisma.activity.update({
    where: { id },
    data: { checked },
    include: { addedBy: true, votes: { include: { user: true } } },
  })
  res.json(activity)
})

// DELETE /api/plans/:planId/activities/:id
router.delete('/:id', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { id } = req.params

  const activity = await prisma.activity.findFirst({
    where: { id, addedById: userId },
  })
  if (!activity) {
    res.status(404).json({ error: 'Not found or not yours' })
    return
  }

  await prisma.activity.delete({ where: { id } })
  res.status(204).send()
})

export default router
