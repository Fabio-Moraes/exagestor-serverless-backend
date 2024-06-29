import express from 'express';

import routesManageService from './manage';
import routesRunningService from './running';

const router = express.Router();

router.use(routesManageService);
router.use(routesRunningService);

export default router;