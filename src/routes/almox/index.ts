import express from 'express';

import routesStock from './stock';
import routesRegister from './register';
import routerhistoric from './historic';

const router = express.Router();

router.use(routesStock);
router.use(routesRegister);
router.use(routerhistoric);
export default router;