import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery, executeTransaction } from '../../../../database';
import { executeWebsocket } from '../../../../functions/websocket/RUNNING-UPDATE';

import { CreateStateModificationHistoryRecord } from '../../../../models/CreateStateModificationHistoryRecord';

import { z, ZodError } from 'zod';

const router = express.Router();
const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().max(17),
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/cancel', async (req: Request, res: Response) => {
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
      const createStateModificationHistoryRecord = await CreateStateModificationHistoryRecord({ row, newStatus })

      await executeTransaction([
        { query: queryDeleteOperations, values: valueDeleteOperations },
        { ...createStateModificationHistoryRecord }
      ]);

      res.json({ success: true });
      await executeWebsocket({ token, employee_id: row.employee_id });
      executionStatus.set(ip, false);
    });
  } catch (error) {
    executionStatus.set(ip, false);

    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    } else {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
});

export default router;