import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeTransaction } from '../../../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/stock/select-employee/insert-material', async (req: Request, res: Response) => {
  try {
    const insertedMaterialSchema = z.array(z.object({
      id: z.number(),
      product_name: z.string(),
      unit_type: z.string(),
      product_code: z.string(),
      product_batch: z.string().nullable(),
      quantity_value: z.string(),
      created_at: z.string(),
    }));

    const paramsSchema = z.object({
      insert: insertedMaterialSchema,
      employee_id: z.number(),
      token: z.string(),
    });

    const {
      insert,
      employee_id,
      token
    } = paramsSchema.parse(req.body);

    if (!token) {
      console.error('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

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

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      function generatePlaceholders(count: number) {
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

      const updateValuesMaterialsStock: Array<number | string | null> = [];
      insert.forEach(item => {
        updateValuesMaterialsStock.push(
          item.id,
          item.product_name,
          item.product_code,
          item.product_batch,
          item.quantity_value,
          item.unit_type,
          createdAt,
        );
      });

      const insertValueMaterialsEmployee:  Array<number | string | null>  = [];
      insert.forEach(item => {
        insertValueMaterialsEmployee.push(
          `${item.product_code}-${employee_id}`,
          employee_id,
          item.product_name,
          item.product_code,
          item.product_batch,
          item.quantity_value,
          item.unit_type,
          createdAt
        );
      });

      const queryMaterialsStock = `
      INSERT INTO exa_stock_almox 
        (id, product_name, product_code, product_batch, quantity_value, unit_type, created_at) 
      VALUES 
        ${generatePlaceholders(7)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;

      const queryMaterialsEmployee = `
      INSERT INTO exa_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
      VALUES ${generatePlaceholders(8)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value + VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;

      await executeTransaction([
        { query: queryMaterialsStock, values: updateValuesMaterialsStock },
        { query: queryMaterialsEmployee, values: insertValueMaterialsEmployee }
      ]);

      res.json({ status: 'success' });
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