import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';
import routesFinish from './finish';

import { z } from 'zod';

const router = express.Router();

router.get('/running', async (req: Request, res: Response) => {
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
        const { id: employeeId } = decoded as { id: number };

        const sql = `
        SELECT *
        FROM users_services u1
        WHERE (u1.status <> ? AND u1.status <> ?)
        AND u1.employee_id = ?
        AND NOT EXISTS (
            SELECT 1
            FROM users_services u2
            WHERE u2.employee_id = u1.employee_id
            AND u2.protocol = u1.protocol
            AND u2.id > u1.id
        )
        ORDER BY u1.created_at DESC
        `;

        const rows = await executeQuery(sql, [statusCanceled, statusCompleted, employeeId]);
        res.json(rows);
    });
});

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);

export default router;
