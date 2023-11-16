import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt'
import bcrypt from 'bcryptjs';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z } from 'zod';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    const paramsSchema = z.object({
        name: z.string().min(1).regex(/^[^0-9]*$/),
        cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
        password: z.string().min(1),
        token: z.string()
    });

    const {
      name,
      cnpj,
      password,
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

        const { company } = decoded as Decoded;

        const hash = bcrypt.hashSync ( password ,  10 )
        
        const values = [
            company.id,
            name,
            'employee',
            cnpj,
            hash,
            createdAt,
        ];

        const sql =
            'INSERT INTO sms_users (company_id, name, role, cnpj, password, created_at) VALUES (?, ?, ?, ?, ?, ?)';

        await executeQuery(sql, values);

        res.json({ success: true });
        console.log('Funcionário(a) registrado com sucesso!');
    });
});

export default router;
