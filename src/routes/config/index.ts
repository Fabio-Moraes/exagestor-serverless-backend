import express from 'express';

import routesSelectTheme from './select-theme';
import routesDisconnectEverything from './disconnect-everything';

const router = express.Router();

router.use(routesSelectTheme);
router.use(routesDisconnectEverything);

export default router;