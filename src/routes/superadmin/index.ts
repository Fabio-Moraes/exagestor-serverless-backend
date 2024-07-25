import express from 'express';

import routesManageService from './manage';
import routesRunningService from './running';
import routesRegisterEmployee from './register-employee';
import routesRegisterService from './register-service';

const router = express.Router();

router.use(routesManageService);
router.use(routesRunningService);
router.use(routesRegisterEmployee);
router.use(routesRegisterService);

export default router;
