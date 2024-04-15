import express from 'express';

import routesStock from './stock';
import routesManageEmployee from './manage';
import routesRegisterMaterial from './register-material';
import routerhistoric from './historic';

const router = express.Router();

router.use(routesStock);
router.use(routesManageEmployee);
router.use(routesRegisterMaterial);
router.use(routerhistoric);
export default router;