import express from 'express';

import routesHistoricService from './historic';
import routesNewService from './new';
import routesRunningService from './running';

const router = express.Router();

router.use(routesHistoricService);
router.use(routesNewService);
router.use(routesRunningService);

export default router;