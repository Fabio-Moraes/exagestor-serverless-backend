import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../config/database';

import { z, ZodError } from 'zod';

const router = express.Router();

const onlyNumbers = /^\d+$/;
const noSpaces = /^\S*$/;

const paramsSchema = z.object({
  productName: z.string().min(1).toUpperCase().trim(),
  productBatch: z.string().toUpperCase().regex(noSpaces).nullable(),
  productCode: z.string().min(1).regex(noSpaces).regex(onlyNumbers),
  quantityValue: z.string().min(1).regex(noSpaces).regex(onlyNumbers),
  unitType: z.enum(['UNID', 'CX', 'METRO']),
  observation: z.string().max(500).nullable(),
  token: z.string()
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

router.post('/register', async (req: Request, res: Response) => {
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

    const {
      productName,
      productCode,
      productBatch,
      quantityValue,
      unitType,
      observation,
      token
    } = paramsSchema.parse(req.body);
    
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

      const createdAt = getCurrentDateTime();
      const values = [
        productName,
        productCode,
        productBatch,
        quantityValue,
        unitType,
        observation,
        createdAt
      ];

      const sqlSelect = 'SELECT * FROM tbl_stock_almox WHERE product_code = ?';
      const rows = await executeQuery(sqlSelect, [productCode]);

      if (rows.length > 0) {
        res.json({ status: 'already registered' });
        console.log('Produto já registrado!');
        return;
      }

      const sqlInsert = `INSERT INTO tbl_stock_almox ( product_name, product_code, product_batch, quantity_value, unit_type, observation, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ? )`;

      await executeQuery(sqlInsert, values);
      
      res.json({ status: 'success' });
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