import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../functions';
import { executeQuery } from '../../../config/database';

import routesSelectEmployee from './select-employee';

import { z, ZodError } from 'zod';

const router = express.Router();

const paramsSchema = z.object({ 
  token: z.string(), 
  productAll: z.boolean(), 
  productCode: z.string() 
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/stock', async (req: Request, res: Response) => {
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

    const { token, productAll, productCode } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      const sqlproductAll = 'SELECT * FROM tbl_stock_almox ORDER BY created_at DESC';
      const sqlProductCode = 'SELECT * FROM tbl_stock_almox WHERE product_code = ?';

      const rows = productAll
        ? await executeQuery(sqlproductAll)
        : await executeQuery(sqlProductCode, [productCode]);

      res.json(rows);
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

router.use(routesSelectEmployee);

export default router;