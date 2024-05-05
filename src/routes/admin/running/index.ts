import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../config/database';

import routesFinish from './finish';
import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/running', async (req: Request, res: Response) => {
  const ip = req.ip;

  if (!ip) {
    console.error('IP não fornecido');
    return res.status(409).json({ error: 'IP não fornecido' });
  }

  if (executionStatus.has(ip) && executionStatus.get(ip) === true) {
    console.error('Já existe uma execução em andamento para este IP');
    return res.status(409).json({ error: 'Já existe uma execução em andamento para este IP' });
  }

  try {
    executionStatus.set(ip, true);

    const paramsSchema = z.object({ token: z.string() });
    const { token } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error) => {
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
      creator_leader_user.name AS name_creator_leader, 
      creator_leader_user.role AS role_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      ORDER BY u1.created_at DESC;
    `;

      const rows = await executeQuery(sql);
      res.json(rows);
    });

  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  } finally {
    executionStatus.set(ip, false);
  }
});

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);

export default router;