import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt';

import { getAuthenticationHash } from '../../../../functions';
import { executeQuery } from '../../../../config/database';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.post('/running/connect-shared', async (req: Request, res: Response) => {
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
    const paramsSchema = z.object({ token: z.string(), password: z.string().max(10) });
    const { token, password } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

        try {
          const { user } = decoded as Decoded;
          const sqlSharedOperations = 'SELECT protocol FROM tbl_shared_service_operations WHERE password = ?';
          const sharedOperations = await executeQuery(sqlSharedOperations, [password]) as { protocol: string }[];
          
          const sqlSharedAuthentication = 'INSERT INTO tbl_shared_service_authorized ( protocol, permission, employee_id, created_at) VALUES ( ?, ?, ?, ? )';
          
          if (sharedOperations.length === 0) {
            res.json({ success: false });
            resolve(true);
            return res.status(404).send('No records found');
          }
          
          const protocol = sharedOperations[0].protocol;
          const createdAt = getCurrentDateTime();
          const values = [protocol, 'analysis', String(user.id), createdAt];

          await executeQuery(sqlSharedAuthentication, values);

          res.json({ success: true });
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