import { Router } from 'express'
import workspaceMembersRoutes from './workspace-members.routes'
import connectionLinksRoutes from './connection-links.routes'

const router = Router()

// Mount workspace member routes
router.use('/', workspaceMembersRoutes)

// Mount connection links routes  
router.use('/', connectionLinksRoutes)

export default router
