import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery } from '../../../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/select-material', async (req: Request, res: Response) => {
  try {
    const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

    const paramsSchema = z.object({
      token: z.string(),
      employeeId: z.string().min(1),
      protocol: z.string().refine((data) => customFormatRegex.test(data)).optional()
    });

    const { token, employeeId, protocol } = paramsSchema.parse(req.body);

    if (!protocol) {
        console.error('Protocol não fornecido');
        return res.status(401).json({ error: 'Protocol não fornecido' });
    }

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
        
        const status = 'finished';
        const sql = `SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? AND status <> ? ORDER BY id DESC`;
        const rows = await executeQuery(sql, [employeeId, protocol, status]);
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

export default router;