import express from 'express';

import routesRunningService from './running';

const router = express.Router();

router.use(routesRunningService);

export default router;