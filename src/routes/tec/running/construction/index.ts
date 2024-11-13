import express from 'express';

import routesClassL from './class-l';
import routesClassF from './class-f';
import routesConnected from './connected';

const router = express.Router();

router.use(routesClassL);
router.use(routesClassF);
router.use(routesConnected);

export default router;