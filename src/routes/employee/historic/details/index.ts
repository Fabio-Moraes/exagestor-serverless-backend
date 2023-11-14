import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery } from '../../../../database';

import { z } from 'zod';

const router = express.Router();

router.get('/historic/details', async (req: Request, res: Response) => {
  const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

  const paramsSchema = z.object({
    token: z.string().min(1).optional(),
    protocol: z.string().refine((data) => customFormatRegex.test(data)).optional(),
    update_count: z.string().min(1).optional(),
  });
  const { token, protocol, update_count } = paramsSchema.parse(req.query);

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

    const { user, company } = decoded as Decoded;
    const sql = 'SELECT * FROM ams_operations WHERE employee_id = ? AND protocol = ? AND update_count = ?';

    const rows = await executeQuery(sql, [user.id, company.id, protocol, update_count]);
    res.json(rows);
  });
});

export default router;
