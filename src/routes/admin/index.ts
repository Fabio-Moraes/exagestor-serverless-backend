import express from 'express';

import routesManageService from './manage';
import routesRunningService from './running';
import routesRunningRegister from './register';

import routesRunningTest from './test';

const router = express.Router();

router.use(routesManageService);
router.use(routesRunningService);
router.use(routesRunningRegister);

router.use(routesRunningTest);

export default router;