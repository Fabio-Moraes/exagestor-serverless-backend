import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt';
import bcrypt from 'bcryptjs';

import { getAuthenticationHash } from '../../../../functions';
import { executeQuery } from '../../../../config/database';

import { z, ZodError } from 'zod';

const router = express.Router();

const paramsSchema = z.object({
  employeeId: z.string().min(1),
  yourPassword: z.string().min(1).trim(),
  newPasswordEmployee: z.string().min(1).trim(),
  token: z.string()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/manage/update_password_employee', async (req: Request, res: Response) => {
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

    const {
      employeeId,
      yourPassword,
      newPasswordEmployee,
      token
    } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const { user: admin } = decoded as Decoded;

      const sqlSelect = 'SELECT * FROM tbl_user_accounts WHERE id = ?';
      const rowsAdmin = await executeQuery(sqlSelect, [admin.id]) as Array<{[key: string]: string}>;

      if (!(rowsAdmin.length === 1 && bcrypt.compareSync(yourPassword, rowsAdmin[0]?.password))) {
        return res.status(401).send('Invalid credentials');
      }
      
      const hashEmployee = bcrypt.hashSync(newPasswordEmployee, 10);
      const values = [hashEmployee, employeeId];
      const sqlUpdate = 'UPDATE tbl_user_accounts SET password = ? WHERE id = ?';

      await executeQuery(sqlUpdate, values);
      res.json({ status: 'success' });
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

export default router;