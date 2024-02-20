import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery, executeTransaction } from '../../../../../database';
import { executeWebsocket } from '../../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();

const isProtocol = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

const paramsSchema = z.object({
  token: z.string(),
  protocol: z.string().regex(isProtocol),
  observation: z.string().max(500).optional(),
  listService: z.string(),
  listMaterial: z.string()
});

function generateQueryListMaterial(arr: string[]) {
  const placeholders = arr.map(() => '?').join(', ');
  return `SELECT * FROM exa_stock_employee WHERE id IN (${placeholders})`;
}

function generatePlaceholders(data: Object[]) {
  const placeholders = data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  return placeholders;
}

router.post('/concluded', async (req: Request, res: Response) => {
  try {
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

      const [row] = await executeQuery('SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? ORDER BY id DESC', [user.id, protocol]);

      if (!row) {
        console.error('Invalid request');
        return res.status(400).json({ error: 'Invalid request' });
      }

      if (row.status === 'concluded') {
        console.error('Service already concluded');
        return res.status(409).json({ error: 'Service already concluded' });
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const valuesInsertOperations = [
        row.employee_id,
        row.client_name,
        row.city,
        row.classification,
        row.nomenclature,
        row.address,
        row.protocol,
        'analysis',
        row.update_count + 1,
        row.created_at,
        row.modification_at,
        listService,
        listMaterial,
        observation,
        createdAt
      ];

      const requestListMaterial = JSON.parse(listMaterial);
      const listMaterialKeys = Object.keys(requestListMaterial);

      const queryListMaterial = generateQueryListMaterial(listMaterialKeys);
      const selectQueryListMaterial = await executeQuery(queryListMaterial, listMaterialKeys);

      const resultQueryListMaterial = selectQueryListMaterial.map(items => {
        return { ...items, quantity_value: items.quantity_value - requestListMaterial[items.id] }
      });

      const queryOperations = 'INSERT INTO exa_operations ( employee_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, list_service, list_material, observation, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

      const updateValueMaterialsEmployee:  Array<number | string | null>  = [];

      resultQueryListMaterial.forEach(item => {
        updateValueMaterialsEmployee.push(
          item.id,
          item.employee_id,
          item.product_name,
          item.product_code,
          item.product_batch,
          requestListMaterial[item.id],
          item.unit_type,
          createdAt
        );
      });

      const queryMaterialsEmployee = `
      INSERT INTO exa_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
      VALUES ${generatePlaceholders(resultQueryListMaterial)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name), 
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;

      await executeTransaction([
        { query: queryOperations, values: valuesInsertOperations },
        { query: queryMaterialsEmployee, values: updateValueMaterialsEmployee }
      ]);

      await executeWebsocket({ token, employee_id: row.employee_id, });
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
  }
});

export default router;