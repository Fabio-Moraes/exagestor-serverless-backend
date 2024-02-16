import express from 'express';

import routesHistoricService from './historic';
import routesNewService from './new';
import routesRunningService from './running';
import routesStockEmployee from './stock';

const router = express.Router();

router.use(routesHistoricService);
router.use(routesNewService);
router.use(routesRunningService);
router.use(routesStockEmployee);

export default router;