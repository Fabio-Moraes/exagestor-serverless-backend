import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../../../functions';
import { executeTransaction } from '../../../../../../config/database';

import { z, ZodError } from 'zod';

import { websocket } from '../../../../../../config/websocket';
import { Socket } from 'socket.io-client';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().max(17),
  adequacyLengthMeters: z.number(),
  id: z.number()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/construction/class-l/cable-adequacy', async (req: Request, res: Response) => {
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
      adequacyLengthMeters,
      id,
      protocol,
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
      const values1 = [
        adequacyLengthMeters,
        protocol,
        id
      ];

      const querySql1 = `
      UPDATE tbl_cable_operations
      SET adequacy_length_meters = adequacy_length_meters + ?
      WHERE protocol = ? AND id = ?`;

      await executeTransaction([ 
        { query: querySql1, values: values1 },
      ]);
 
      const socket = await websocket(token) as Socket;
      socket.emit('RUNNING_REFRESH_CLASS_L', JSON.stringify({ protocol: protocol }));
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