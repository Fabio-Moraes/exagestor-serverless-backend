import express from 'express';

import routesManageService from './manage';
import routesRunningService from './running';
import routesRegisterEmployee from './register-employee';

const router = express.Router();

router.use(routesManageService);
router.use(routesRunningService);
router.use(routesRegisterEmployee);

export default router;