import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesDetailsService from './details';


import { z } from 'zod';

const router = express.Router();

router.get('/historic', async (req: Request, res: Response) => {
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

        const { user } = decoded as Decoded;
        const sql = `SELECT * FROM exa_operations WHERE employee_id = ? AND team = ? ORDER BY id DESC`;

        const rows = await executeQuery(sql, [user.id, user.team]);
        res.json(rows);
    });
});

router.use(routesDetailsService);

export default router;
