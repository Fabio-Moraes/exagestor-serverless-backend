import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '../../../../../constants';
import { decrement_item } from '../../../../../models/stock_employee';
import { executeQuery, executeTransaction } from '../../../../../config/database';

import { z, ZodError } from 'zod';
import { insert_state_modification } from '../../../../../models/operation_logs';
import { Socket } from 'socket.io-client';
import { websocket } from '../../../../../config/websocket';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  employeeId: z.string().min(1),
  protocol: z.string().max(17),
  observation: z.string().max(500).optional(),
  listService: z.string(),
  listMaterial: z.string()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/concluded', async (req: Request, res: Response) => {
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

    const { token, employeeId, protocol, observation, listService, listMaterial } = paramsSchema.parse(req.body);

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

      const sql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?';
      const [row] = await executeQuery(sql, [employeeId, protocol]);

      if (!row) {
        console.error('Requisição inválida');
        return res.status(400).json({ error: 'Requisição inválida' });
      }

      if (row.status === 'concluded') {
        console.error('Serviço já concluído');
        return res.status(409).json({ error: 'Serviço já concluído' });
      }

      const executeTransactionArray = []

      const queryOperations = 'DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?'
      const deleteValues = [row.employee_id, row.protocol];
      executeTransactionArray.push({ query: queryOperations, values: deleteValues });

      const modification = {
        row,
        newStatus: 'analysis',
        listMaterial,
        listService,
        observation
      } as const;

      const createStateModificationHistoryRecord = await insert_state_modification(modification)
      executeTransactionArray.push(createStateModificationHistoryRecord);

      if (row.status !== 'analysis') {
        const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
        executeTransactionArray.push(decrementStockItemQuantityEmployee);
      }

      await executeTransaction(executeTransactionArray);
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