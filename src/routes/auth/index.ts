import express from 'express';

import routesSignin from './signin';
import routesDataUser from './data_user';

const router = express.Router();

router.use(routesSignin);
router.use(routesDataUser);

export default router;