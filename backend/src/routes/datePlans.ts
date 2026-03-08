import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthedRequest } from '../middleware/clerkAuth'

const router = Router()

const PLAN_INCLUDE = {
  creator: true,
  members: { include: { user: true } },
  whenOptions: { include: { votes: { include: { user: true } } } },
  locations: { include: { votes: { include: { user: true } }, addedBy: true } },
  activities: {
    include: { votes: { include: { user: true } }, addedBy: true },
    orderBy: { createdAt: 'asc' as const },
  },
  feedItems: {
    include: { user: true },
    orderBy: { createdAt: 'desc' as const },
    take: 20,
  },
}

// GET /api/plans?timeframe=upcoming|past — list plans for the current user
router.get('/', requireAuth, async (req, res: Response) => {
  try {
    const { userId } = req as AuthedRequest
    const { timeframe } = req.query
    const now = new Date()

    // upcoming = plans with a future date OR no date yet (still planning)
    // past     = plans with a confirmed date in the past
    const timeframeWhere =
      timeframe === 'upcoming'
        ? { OR: [{ confirmedDate: { gte: now } }, { confirmedDate: null }] }
        : timeframe === 'past'
        ? { confirmedDate: { lt: now } }
        : {}

    const plans = await prisma.datePlan.findMany({
      where: {
        members: { some: { userId } },
        ...timeframeWhere,
      },
      include: { creator: true, members: { include: { user: true } }, locations: true, activities: true },
      orderBy:
        timeframe === 'past'
          ? { confirmedDate: 'desc' }
          : { createdAt: 'desc' },
    })
    res.json(plans)
  } catch (err) {
    console.error('[GET /plans] error:', err)
    res.status(500).json({ error: 'Failed to fetch plans', detail: String(err) })
  }
})

// POST /api/plans/complete — create a fully confirmed plan in one shot
router.post('/complete', requireAuth, async (req, res: Response) => {
  try {
  const { userId } = req as AuthedRequest
  const {
    title,
    date,
    timeSlot,
    location,
    activities,
  } = req.body as {
    title: string
    date?: string
    timeSlot?: string
    location?: {
      name: string
      meta?: string
      emoji: string
      gradientFrom: string
      gradientTo: string
    }
    activities?: Array<{ name: string; emoji: string; category: string }>
  }

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.datePlan.create({
      data: {
        title: title?.trim() || 'Our Date',
        status: 'confirmed',
        confirmedDate: date ? new Date(date) : undefined,
        confirmedTimeSlot: timeSlot,
        confirmedAt: new Date(),
        createdById: userId,
        members: { create: { userId, role: 'owner' } },
        feedItems: {
          create: {
            userId,
            action: 'created_plan',
            details: JSON.stringify({ title }),
          },
        },
      },
    })

    if (date || timeSlot) {
      await tx.whenOption.create({
        data: {
          planId: created.id,
          date: date ? new Date(date) : undefined,
          timeSlot,
        },
      })
    }

    let confirmedLocationId: string | undefined
    if (location?.name) {
      const loc = await tx.location.create({
        data: {
          planId: created.id,
          name: location.name,
          meta: location.meta,
          emoji: location.emoji,
          gradientFrom: location.gradientFrom,
          gradientTo: location.gradientTo,
          addedById: userId,
        },
      })
      confirmedLocationId = loc.id
    }

    if (activities?.length) {
      await tx.activity.createMany({
        data: activities.map((a) => ({
          planId: created.id,
          name: a.name,
          emoji: a.emoji,
          category: a.category,
          addedById: userId,
          checked: true,
        })),
      })
    }

    if (confirmedLocationId) {
      await tx.datePlan.update({
        where: { id: created.id },
        data: { confirmedLocationId },
      })
    }

    return created
  })

  const fullPlan = await prisma.datePlan.findUnique({
    where: { id: plan.id },
    include: PLAN_INCLUDE,
  })
  res.status(201).json(fullPlan)
  } catch (err) {
    console.error('[POST /plans/complete] error:', err)
    res.status(500).json({ error: 'Failed to create plan', detail: String(err) })
  }
})

// GET /api/plans/preview/:token — public, no auth needed
router.get('/preview/:token', async (req, res: Response) => {
  try {
    const plan = await prisma.datePlan.findUnique({
      where: { shareToken: req.params.token },
      select: {
        id: true,
        title: true,
        confirmedDate: true,
        confirmedTimeSlot: true,
        locations: { select: { name: true, emoji: true, gradientFrom: true, gradientTo: true } },
        members: { include: { user: { select: { name: true } } } },
      },
    })
    if (!plan) { res.status(404).json({ error: 'Invalid share link' }); return }
    res.json(plan)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plan preview', detail: String(err) })
  }
})

// GET /api/plans/join/:token — must be before /:id
router.get('/join/:token', requireAuth, async (req, res: Response) => {
  try {
    const { userId } = req as AuthedRequest
    const plan = await prisma.datePlan.findUnique({
      where: { shareToken: req.params.token },
    })
    if (!plan) { res.status(404).json({ error: 'Invalid share link' }); return }

    await prisma.planMember.upsert({
      where: { planId_userId: { planId: plan.id, userId } },
      create: { planId: plan.id, userId, role: 'member' },
      update: {},
    })
    await prisma.feedItem.create({
      data: { planId: plan.id, userId, action: 'joined_plan' },
    })
    res.json({ planId: plan.id })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join plan', detail: String(err) })
  }
})

// GET /api/plans/:id
router.get('/:id', requireAuth, async (req, res: Response) => {
  try {
    const { userId } = req as AuthedRequest
    const plan = await prisma.datePlan.findFirst({
      where: { id: req.params.id, members: { some: { userId } } },
      include: PLAN_INCLUDE,
    })
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return }
    res.json(plan)
  } catch (err) {
    console.error('[GET /plans/:id] error:', err)
    res.status(500).json({ error: 'Failed to fetch plan', detail: String(err) })
  }
})

// PATCH /api/plans/:id — edit an ongoing plan
router.patch('/:id', requireAuth, async (req, res: Response) => {
  try {
    const { userId } = req as AuthedRequest
    const { title, occasion, confirmedDate, confirmedTimeSlot, confirmedLocationId } =
      req.body as {
        title?: string
        occasion?: string
        confirmedDate?: string | null
        confirmedTimeSlot?: string
        confirmedLocationId?: string
      }

    const member = await prisma.planMember.findFirst({
      where: { planId: req.params.id, userId },
    })
    if (!member) { res.status(403).json({ error: 'Forbidden' }); return }

    const plan = await prisma.datePlan.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(occasion !== undefined && { occasion }),
        ...(confirmedDate !== undefined && {
          confirmedDate: confirmedDate ? new Date(confirmedDate) : null,
        }),
        ...(confirmedTimeSlot !== undefined && { confirmedTimeSlot }),
        ...(confirmedLocationId !== undefined && { confirmedLocationId }),
      },
      include: PLAN_INCLUDE,
    })
    res.json(plan)
  } catch (err) {
    console.error('[PATCH /plans/:id] error:', err)
    res.status(500).json({ error: 'Failed to update plan', detail: String(err) })
  }
})

// DELETE /api/plans/:id
router.delete('/:id', requireAuth, async (req, res: Response) => {
  try {
    const { userId } = req as AuthedRequest
    const member = await prisma.planMember.findFirst({
      where: { planId: req.params.id, userId, role: 'owner' },
    })
    if (!member) { res.status(403).json({ error: 'Forbidden' }); return }
    await prisma.datePlan.delete({ where: { id: req.params.id } })
    res.status(204).send()
  } catch (err) {
    console.error('[DELETE /plans/:id] error:', err)
    res.status(500).json({ error: 'Failed to delete plan', detail: String(err) })
  }
})

export default router
