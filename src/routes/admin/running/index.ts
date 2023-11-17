import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.get('/running', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({ token: z.string().min(1).optional() });
    const { token } = paramsSchema.parse(req.query);

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
 
        const statusCanceled = 'canceled';
        const statusCompleted = 'concluded';
        const { company } = decoded as Decoded;

        const sql = `
        SELECT u1.*, sms_users.name AS name_employee
        FROM sms_operations u1
        JOIN sms_users 
        ON u1.employee_id = sms_users.id
        WHERE (u1.status <> ? AND u1.status <> ?)
        AND u1.company_id = ?
        AND NOT EXISTS (
            SELECT 1
            FROM sms_operations u2
            WHERE u2.protocol = u1.protocol
            AND u2.id > u1.id
        )
        ORDER BY u1.created_at DESC;
            `;
    
        const rows = await executeQuery(sql, [statusCanceled, statusCompleted, company.id]);
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
