import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../../../functions';
import { executeQuery, executeTransaction } from '../../../../../../config/database';

import { z, ZodError } from 'zod';
import { Decoded } from '../../../../../../types/jwt';

import { websocket } from '../../../../../../config/websocket';
import { Socket } from 'socket.io-client';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().max(17),
  usedLengthMeters: z.number(),
  id: z.number()
});

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

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/construction/class-l/cable-laying', async (req: Request, res: Response) => {
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
      protocol,
      usedLengthMeters,
      id,
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
      const createdAt = getCurrentDateTime();
      const { user: employee } = decoded as Decoded;

      const valuesCableSelected = [
        usedLengthMeters,
        id
      ];

      const sqlCableId = 'SELECT cable_id FROM tbl_cable_selected WHERE id = ?';
      const [row] = await executeQuery(sqlCableId, [id]) as Array<{[key: string]: string}>;

      const valuesCableOperations = [
        protocol,
        usedLengthMeters,
        0,
        employee.id,
        row.cable_id,
        createdAt
      ];

      const querySqlCableSelected = `
      UPDATE tbl_cable_selected SET used_length_meters = used_length_meters + ? WHERE id = ?`;

      const querySqlCableOperations = 'INSERT INTO tbl_cable_operations ( protocol, cable_length_meters, adequacy_length_meters, employee_id, cable_id, created_at) VALUES ( ?, ?, ?, ?, ?, ?)';

      const querySqlCableOperationsLog = 'INSERT INTO tbl_cable_operations_logs ( protocol, cable_length_meters, adequacy_length_meters, employee_id, cable_id, created_at) VALUES ( ?, ?, ?, ?, ?, ?)';

      await executeTransaction([ 
        { query: querySqlCableSelected, values: valuesCableSelected },
        { query: querySqlCableOperations, values: valuesCableOperations },
        { query: querySqlCableOperationsLog, values: valuesCableOperations }
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