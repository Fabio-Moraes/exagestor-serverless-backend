import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery, executeTransaction } from '../../../../config/database';

import { insert_state_modification } from '../../../../models/operation_logs';
import { z, ZodError } from 'zod';

import { Socket } from 'socket.io-client';
import { websocket } from '../../../../config/websocket';

const router = express.Router();
const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().max(17),
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/running/cancel', async (req: Request, res: Response) => {
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

    const { token, protocol } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('Token expirado')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('Token inválido')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const { user } = decoded as Decoded;
      const selectSql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?';
      const [row] = await executeQuery(selectSql, [user.id, protocol]);

      if (!row) { return res.status(400).json({ error: 'Requisição inválido' }) }

      const valueDeleteOperations = [row.employee_id, row.protocol];
      const queryDeleteOperations = 'DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?'

      const newStatus = 'canceled';
      const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus })

      await executeTransaction([
        { query: queryDeleteOperations, values: valueDeleteOperations },
        { ...createStateModificationHistoryRecord }
      ]);

      const socket = await websocket(token) as Socket;
      socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: row.employee_id }));
      res.json({ success: true });
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