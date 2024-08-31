import express from 'express';

import routesClassL from './class-l';

const router = express.Router();

router.use(routesClassL);

export default router;