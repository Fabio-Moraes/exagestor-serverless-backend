import express from 'express';

import routesStock from './stock';
import routesRegister from './register';

const router = express.Router();

router.use(routesStock);
router.use(routesRegister);

export default router;