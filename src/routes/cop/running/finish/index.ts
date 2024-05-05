import express from 'express';

import routesConcludedService from './concluded';
import routesSelectMaterial from './select-material';
import routesSelectService from './select-service';

const router = express.Router();

router.use(routesConcludedService);
router.use(routesSelectMaterial);
router.use(routesSelectService);

export default router;