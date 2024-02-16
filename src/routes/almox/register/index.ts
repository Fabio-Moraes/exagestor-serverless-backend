import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({
      productName: z.string().min(1).toLowerCase(),
      productBatch: z.string().toUpperCase(),
      productCode: z.string().min(1),
      quantityValue: z.string().min(1),
      unitType: z.string().min(1),
      observation: z.string().max(500).nullable(),
      token: z.string()
    });

    const {
      productName,
      productCode,
      productBatch,
      quantityValue,
      unitType,
      observation,
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

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      const createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      //const { user } = decoded as Decoded;

      function formatProductBatch(productBatch: string): string | null {
        return (productBatch === '' || /^[0]+$/.test(productBatch)) ? null : productBatch;
      }

      const values = [
        productName,
        productCode,
        formatProductBatch(productBatch),
        quantityValue,
        unitType,
        observation,
        createdAt
      ];

      const sqlSelect = 'SELECT * FROM exa_stock_almox WHERE product_code = ?';

      const rows = await executeQuery(sqlSelect, [productCode]);

      if (rows.length > 0) {
        res.json({ status: 'already registered' });
        console.log('Produto não registrado!');
        return;
      }

      const sqlInsert = `INSERT INTO exa_stock_almox ( product_name, product_code, product_batch, quantity_value, unit_type, observation, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ? )`;

      await executeQuery(sqlInsert, values);

      res.json({ status: 'success' });
      console.log('Produto registrado com sucesso!');
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