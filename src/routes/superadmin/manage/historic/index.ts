import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../functions';
import { executeQuery } from '../../../../config/database';

import routesDetails from './details';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

const paramsSchema = z.object({
  employee_all: z.boolean().optional(),
  employee_id: z.number().optional(),
  initial_id: z.number().nullable().optional(),
  token: z.string(),
});

router.post('/manage/historic', async (req: Request, res: Response) => {
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

    const { employee_all, employee_id, initial_id, token } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
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
      };

      const selectEmployeeAll = async (initial_id?: number | null) => {
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
        ORDER BY id DESC
        LIMIT 10;
        `;

        if (!initial_id) return await executeQuery(sqlFirst);
        return await executeQuery(sqlLast, [initial_id]);
      };

      const resultEmployeeAll = await selectEmployeeAll(initial_id);
      const resultEmployee = await selectEmployee(initial_id, employee_id);

      res.json(employee_all ? resultEmployeeAll : resultEmployee);
      resolve(true);
        }
        catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('Token expirado');
      return res.status(403).json({ error: 'Token expirado' });
    }

    if (error instanceof JsonWebTokenError) {
      console.log('Token inválido');
      return res.status(403).json({ error: 'Token inválido' });
    }

    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    executionStatus.set(ip, false);
  }
});

router.use(routesDetails);

export default router;
