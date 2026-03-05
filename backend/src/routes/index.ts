import { Router } from 'express'
import datePlansRouter from './datePlans'
import locationsRouter from './locations'
import activitiesRouter from './activities'
import votesRouter from './votes'

const router = Router()

router.use('/plans', datePlansRouter)
router.use('/plans/:planId/locations', locationsRouter)
router.use('/plans/:planId/activities', activitiesRouter)
router.use('/plans/:planId', votesRouter)

router.get('/health', (_req, res) => res.json({ ok: true }))

export default router
