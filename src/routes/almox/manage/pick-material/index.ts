import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../functions';
import { executeTransaction } from '../../../../config/database';

import { material_operation } from '../../../../models/stock_logs/material_operation';

import { z, TypeOf, ZodError } from 'zod';

const router = express.Router();

const insertedMaterialSchema = z.array(z.object({
  id: z.string().min(1),
  product_name: z.string(),
  unit_type: z.string(),
  product_code: z.string(),
  product_batch: z.string().nullable(),
  quantity_value: z.string(),
  category: z.string(),
  created_at: z.string(),
}));

const paramsSchema = z.object({
  insert: insertedMaterialSchema,
  employee_id: z.number(),
  token: z.string(),
});

type InsertedMaterial = TypeOf<typeof insertedMaterialSchema>;

function generatePlaceholders(count: number, insert: InsertedMaterial) {
  let valueQuery = '';
  const placeholders = Array(count).fill('?').join(', ');

  for (let i = 0; i < insert.length; i++) {
    const valueSql = `(${placeholders})`;
    valueQuery += valueSql;
    if (i < insert.length - 1) {
      valueQuery += ', ';
    }
  }
  return valueQuery;
}

function getBeforeHyphen(text: string) {
  const parts = text.split('-');
  return Number(parts[0]);
}

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

router.post('/manage/pick-material', async (req: Request, res: Response) => {
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

    const { insert, employee_id, token } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const createdAt = getCurrentDateTime();

      const updateValuesMaterialsStock: Array<number | string | null> = [];
      insert.forEach(item => {
        updateValuesMaterialsStock.push(
          getBeforeHyphen(item.id),
          item.product_name,
          item.product_code,
          item.product_batch,
          item.quantity_value,
          item.unit_type,
          item.category,
          createdAt,
        );
      });

      const insertValueMaterialsEmployee: Array<number | string | null> = [];
      insert.forEach(item => {
        insertValueMaterialsEmployee.push(
          item.id,
          employee_id,
          item.product_name,
          item.product_code,
          item.product_batch,
          item.quantity_value,
          item.unit_type,
          item.category,
          createdAt
        );
      });

      const queryMaterialsStock = `
      INSERT INTO tbl_stock_almox 
        (id, product_name, product_code, product_batch, quantity_value, unit_type, category, created_at) 
      VALUES 
        ${generatePlaceholders(8, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value + VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        category = VALUES(category),
        created_at = VALUES(created_at);
      `;

      const queryMaterialsEmployee = `
      INSERT INTO tbl_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, category, created_at)
      VALUES ${generatePlaceholders(9, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        category = VALUES(category),
        created_at = VALUES(created_at);
      `;

      const queryMaterialsStockTransferLog = await material_operation({
        insert, employeeId: employee_id, transferType: 'sent'
      });

      await executeTransaction([
        { query: queryMaterialsStock, values: updateValuesMaterialsStock },
        { query: queryMaterialsEmployee, values: insertValueMaterialsEmployee },
        { ...queryMaterialsStockTransferLog }
      ]);

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