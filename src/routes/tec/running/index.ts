import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';
import routesFinish from './finish';

import { z, ZodError } from 'zod';

const router = express.Router();

router.get('/running', async (req: Request, res: Response) => {  
  try {
    const token = req.cookies.get('auth_token')?.value
    
    //const { cookies } = req;
    //const token = cookies.auth_token;
    
    if (!token) {
      console.error('Token not provided');
      return res.status(401).json({ error: 'Token not provided' });
    }

    jwt.verify(token, JWT_SECRET_KEY, async (error: any, decoded: any) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** Verify token expired **')
          return res.status(403).json({ error: 'Token expired' });
        } else {
          console.log('** Verify token invalid **')
          return res.status(403).json({ error: 'Invalid token' });
        }
      }

      const statusCanceled = 'canceled';
      const statusCompleted = 'concluded';
      const { user } = decoded as Decoded;

      const sql = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        admin_user.name AS name_admin
        FROM exa_operations u1
        JOIN exa_users tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN exa_users admin_user
        ON u1.admin_id = admin_user.id
        WHERE (u1.status <> ? AND u1.status <> ?)
        AND u1.employee_id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM exa_operations u2
          WHERE u2.protocol = u1.protocol
          AND u2.id > u1.id
        )
        ORDER BY u1.created_at DESC;
      `;

      const rows = await executeQuery(sql, [statusCanceled, statusCompleted, user.id]);
      res.json(rows);
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Invalid Zod request', error.errors);
      return res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);

export default router;
