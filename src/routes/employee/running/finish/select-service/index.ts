import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery } from '../../../../../database';

import { z } from 'zod';

const router = express.Router();

router.get('/select-service', async (req: Request, res: Response) => {
    const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

    const paramsSchema = z.object({
        token: z.string().min(1).optional(),
        protocol: z.string().refine((data) => customFormatRegex.test(data)).optional()
    });

    const { token, protocol } = paramsSchema.parse(req.query);

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
        const { id: employeeId } = decoded as { id: number };
        const sql = `SELECT * FROM users_services WHERE employee_id = ? AND protocol = ?`;
        const rows = await executeQuery(sql, [employeeId, protocol, status]);
        res.json(rows);
    });
});

export default router;
