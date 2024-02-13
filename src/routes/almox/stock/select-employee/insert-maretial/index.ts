import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery } from '../../../../../database';

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
      token: z.string(),
    });

    const {
      insert,
      token
    } = paramsSchema.parse(req.body);

    if (!token) {
      console.error('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

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

      //const now = new Date();
      //const year = now.getFullYear();
      //const month = (now.getMonth() + 1).toString().padStart(2, '0');
      //const day = now.getDate().toString().padStart(2, '0');
      //const hours = now.getHours().toString().padStart(2, '0');
      //const minutes = now.getMinutes().toString().padStart(2, '0');
      //const seconds = now.getSeconds().toString().padStart(2, '0');

      //const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      //const { user } = decoded as Decoded;

      function formatProductBatch(productBatch: string): string | null {
        return (productBatch === '' || /^[0]+$/.test(productBatch)) ? null : productBatch;
      }

      //const values = [
      //  productName,
      //  productCode,
      //  formatProductBatch(productBatch),
      //  quantityValue,
      //  unitType,
      //  createdAt,
      //];

      //const sqlSelect = 'SELECT * FROM exa_materials_stock WHERE product_code = ?';

      //const rows = await executeQuery(sqlSelect, [ productCode ]);

      //if (rows.length > 0) {
      //  res.json({ status: 'already registered' });
      //  console.log('Produto não registrado!');
      //  return;
      //}

      //const sqlInsert = `INSERT INTO exa_materials_stock ( product_name, product_code, product_batch, quantity_value, unit_type, created_at) VALUES ( ?, ?, ?, ?, ?, ?)`;
//
      //await executeQuery(sqlInsert, values);

      res.json({ status: 'success' });
      console.log('Registrado concluído com sucesso!', insert);
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