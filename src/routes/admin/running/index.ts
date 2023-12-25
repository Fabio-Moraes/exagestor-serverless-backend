import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';
import routesFinish from './finish';

const router = express.Router();

router.get('/running', async (req: Request, res: Response) => {
  try {
    const { cookies } = req;
    const token = cookies.auth_token;

    console.log('@@@@', token);
    
    if (!token) {
      console.error('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET_KEY, async (error: any) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** verify token expired **')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('** verify token inválido **')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

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
        AND NOT EXISTS (
          SELECT 1
          FROM exa_operations u2
          WHERE u2.protocol = u1.protocol
          AND u2.id > u1.id 
          )
          ORDER BY u1.created_at DESC;
          `;

      const statusCanceled = 'canceled';
      const statusCompleted = 'concluded';

      const rows = await executeQuery(sql, [statusCanceled, statusCompleted]);
      res.json(rows);
    });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);

export default router;
