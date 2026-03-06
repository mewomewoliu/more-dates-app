import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthedRequest } from '../middleware/clerkAuth'

const router = Router({ mergeParams: true })

// POST /api/plans/:planId/votes
router.post('/votes', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { planId } = req.params
  const { whenOptionId, locationId, activityId, value } = req.body as {
    whenOptionId?: string
    locationId?: string
    activityId?: string
    value: 'yes' | 'no' | 'heart'
  }

  const member = await prisma.planMember.findFirst({ where: { planId, userId } })
  if (!member) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  // Upsert vote
  let vote
  if (whenOptionId) {
    vote = await prisma.vote.upsert({
      where: { userId_whenOptionId: { userId, whenOptionId } },
      create: { userId, whenOptionId, value },
      update: { value },
      include: { user: true },
    })
  } else if (locationId) {
    vote = await prisma.vote.upsert({
      where: { userId_locationId: { userId, locationId } },
      create: { userId, locationId, value },
      update: { value },
      include: { user: true },
    })

    const location = await prisma.location.findUnique({ where: { id: locationId }, select: { name: true } })
    await prisma.feedItem.create({
      data: {
        planId,
        userId,
        action: 'voted_location',
        details: JSON.stringify({ locationName: location?.name, value }),
      },
    })
  } else if (activityId) {
    vote = await prisma.vote.upsert({
      where: { userId_activityId: { userId, activityId } },
      create: { userId, activityId, value },
      update: { value },
      include: { user: true },
    })
  }

  res.json(vote)
})

// POST /api/plans/:planId/when-options — add or update a date/time option
router.post('/when-options', requireAuth, async (req, res: Response) => {
  const { userId } = req as AuthedRequest
  const { planId } = req.params
  const { date, timeSlot } = req.body as { date?: string; timeSlot?: string }

  const member = await prisma.planMember.findFirst({ where: { planId, userId } })
  if (!member) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const option = await prisma.whenOption.create({
    data: {
      planId,
      date: date ? new Date(date) : undefined,
      timeSlot,
    },
    include: { votes: { include: { user: true } } },
  })

  await prisma.feedItem.create({
    data: { planId, userId, action: 'set_date', details: JSON.stringify({ date, timeSlot }) },
  })

  res.status(201).json(option)
})

export default router
