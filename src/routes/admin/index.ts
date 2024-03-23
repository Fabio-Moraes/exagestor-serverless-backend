import express from 'express';

import routesManageService from './manage';
import routesRunningService from './running';
import routesRunningRegister from './register';

const router = express.Router();

router.use(routesManageService);
router.use(routesRunningService);
router.use(routesRunningRegister);

export default router;

//