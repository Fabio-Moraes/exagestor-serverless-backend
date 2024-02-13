import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesSelectEmployee from './select-employee';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/stock', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({ token: z.string().min(1).optional() });
    const { token } = paramsSchema.parse(req.body);

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

      const sql = `SELECT * FROM exa_materials_stock ORDER BY id DESC`;

      const rows = await executeQuery(sql);
      res.json(rows);
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

router.use(routesSelectEmployee);

export default router;