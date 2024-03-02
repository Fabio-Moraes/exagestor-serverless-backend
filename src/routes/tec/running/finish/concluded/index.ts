import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery, executeTransaction } from '../../../../../config/database';
import { executeWebsocket } from '../../../../../controllers/websocket/running_update';

import { z, ZodError } from 'zod';
import { decrement_item } from '../../../../../models/stock_employee';
import { insert_state_modification } from '../../../../../models/operation_logs';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().max(17),
  observation: z.string().max(500).optional(),
  listService: z.string(),
  listMaterial: z.string()
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

router.post('/running/finish/concluded', async (req: Request, res: Response) => {
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

    const { token, protocol, observation, listMaterial, listService } = paramsSchema.parse(req.body);

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

      const { user } = decoded as Decoded
      const selectSql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?';
      const [row] = await executeQuery(selectSql, [user.id, protocol, 'active']);

      if (!row) {
        console.error('Invalid request');
        return res.status(400).json({ error: 'Invalid request' });
      }

      const newStatus = 'analysis';

      const createdAt = getCurrentDateTime();
      const valuesInsertOperations = [
        row.protocol,
        row.employee_id,
        null,
        row.client_name,
        row.city,
        row.classification,
        row.nomenclature,
        row.address,
        newStatus,
        row.update_count,
        row.created_at,
        row.modification_at,
        listService,
        listMaterial,
        observation,
        createdAt
      ];

      const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          admin_id,
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          created_at, 
          modification_at, 
          list_service, 
          list_material,
          observation,  
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
          protocol = VALUES(protocol),
          employee_id = VALUES(employee_id),
          admin_id = VALUES(admin_id),
          client_name = VALUES(client_name),
          city = VALUES(city),
          classification = VALUES(classification),
          nomenclature = VALUES(nomenclature),
          address = VALUES(address),
          status = VALUES(status),
          update_count = update_count + 1,
          modification_at = VALUES(modification_at),
          list_service = VALUES(list_service),
          list_material = VALUES(list_material),
          observation = VALUES(observation),
          finished_at = VALUES(finished_at);`;

      const createStateModificationHistoryRecord = await insert_state_modification({
        row, newStatus, listMaterial, listService, observation
      })

      const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);

      await executeTransaction([
        { query: queryOperations, values: valuesInsertOperations },
        { ...createStateModificationHistoryRecord },
        { ...decrementStockItemQuantityEmployee }
      ]);

      res.json({ success: true });
      executionStatus.set(ip, false);
      
      await executeWebsocket({ token, employee_id: row.employee_id, });
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