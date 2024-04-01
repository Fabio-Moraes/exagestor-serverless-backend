import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
//import type { Decoded } from '../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery } from '../../../../config/database';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

const paramsSchema = z.object({
  employee_id: z.number().optional(),
  token: z.string(),
});

router.post('/manage/employee-historic', async (req: Request, res: Response) => {
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
    const { employee_id, token } = paramsSchema.parse(req.body);

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

      //const { user } = decoded as Decoded;

      const sqlEmployee = `
      SELECT u1.*, 
      tec_user.name AS name_tec, 
      admin_user.name AS name_admin
      FROM tbl_operations_logs u1
      JOIN tbl_user_accounts tec_user
      ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts admin_user
      ON u1.admin_id = admin_user.id
      WHERE employee_id = ? 
      ORDER BY u1.id DESC;
      `;

      const sqlEmployeeAll = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        admin_user.name AS name_admin
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts admin_user
        ON u1.admin_id = admin_user.id
        ORDER BY u1.id DESC;
        `;

      const employee = await executeQuery(sqlEmployee, [employee_id]); 
      const employeeAll = await executeQuery(sqlEmployeeAll);

      res.json(employee_id ? employee : employeeAll);
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

export default router;
