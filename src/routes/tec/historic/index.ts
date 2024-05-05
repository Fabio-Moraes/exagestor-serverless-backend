import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../config/database'
import type { Decoded } from '../../../types/jwt'
import routesDetails from './details';;

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

const paramsSchema = z.object({
  initial_id: z.number().nullable().optional(),
  token: z.string(),
});

router.post('/historic', async (req: Request, res: Response) => {
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
    const { initial_id, token } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** verify token expired **')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('** verify token inválido **')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const selectEmployee = async (initial_id?: number | null, employee_id?: number) => {
        const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;

        const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;

        if (!initial_id) return await executeQuery(sqlFirst, [employee_id]);
        return await executeQuery(sqlLast, [initial_id, employee_id]);
      }

      const { user: admin } = decoded as Decoded;
      const resultEmployee = await selectEmployee(initial_id, admin.id);

      res.json(resultEmployee);
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

router.use(routesDetails);

export default router;
