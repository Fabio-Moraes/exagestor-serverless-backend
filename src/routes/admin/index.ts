import express from 'express';

import routesRunningService from './running';
import routesRunningRegister from './register';

const router = express.Router();

router.use(routesRunningService);
router.use(routesRunningRegister);

export default router;