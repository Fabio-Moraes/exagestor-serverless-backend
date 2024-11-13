import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { getAuthenticationHash } from '../../../../../functions';
import { decrement_item } from '../../../../../models/stock_employee';
import { executeQuery, executeTransaction } from '../../../../../config/database';

import { z, ZodError } from 'zod';
import { insert_state_modification } from '../../../../../models/operation_logs';
import { Socket } from 'socket.io-client';
import { websocket } from '../../../../../config/websocket';

interface ServiceData {
  id: number;
  client_name: string;
  employee_id: string;
  creator_leader_id: string;
  city: string;
  address: string;
  nomenclature: string;
  classification: string;
  status: string;
  update_count: number;
  start_service_at: string;
  created_at: string;
  modification_at: string;
  finished_at: string;
  list_material: string;
  list_service: string;
  list_dgoandbox: string;
  observation: string;
  type_operation: string;
  protocol: string;
}


const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  employeeId: z.string().min(1),
  protocol: z.string().max(17),
  observation: z.string().max(500).optional(),
  listService: z.string(),
  listMaterial: z.string().optional()
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
    
    const body = paramsSchema.parse(req.body);
    const { token, employeeId, protocol, observation, listService, listMaterial } = body;
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const sql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?';
      const [row] = await executeQuery(sql, [employeeId, protocol]) as Array<ServiceData>;

      if (!row) {
        console.error('Requisição inválida');
        return res.status(400).json({ error: 'Requisição inválida' });
      }

      if (row.status === 'concluded') {
        console.error('Serviço já concluído');
        return res.status(409).json({ error: 'Serviço já concluído' });
      }

      const executeTransactionArray = [];

      const queryOperations = 'DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?';
      const deleteValues = [row.employee_id, row.protocol];

      executeTransactionArray.push({ query: queryOperations, values: deleteValues });

      const newStatus = 'concluded';
      const createStateModificationHistoryRecord = await insert_state_modification({
        row, newStatus, listMaterial, listService, observation
      });

      executeTransactionArray.push(createStateModificationHistoryRecord);

      if (row.status !== 'analysis' && listMaterial) {
        const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
        executeTransactionArray.push(decrementStockItemQuantityEmployee);
      }

      await executeTransaction(executeTransactionArray);
      const socket = await websocket(token) as Socket;
      socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: row.employee_id }));
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