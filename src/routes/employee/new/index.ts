import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt'

import { createProtocol } from '../../../components/CreateProtocol';
import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/new', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({
        clientName: z.string().min(1).regex(/^[^0-9]*$/),
        city: z.string().min(1).regex(/^[^0-9]*$/),
        classification: z.string().min(1).max(2),
        nomenclature: z.string().min(1),
        address: z.string().min(1),
        token: z.string()
    });

    const {
        clientName,
        city,
        classification,
        nomenclature,
        address,
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
        const protocol = createProtocol();
        const status = 'active';
        const updateCount = 0

        const { user, company } = decoded as Decoded;

        const values = [
            company.id,
            user.id,
            clientName,
            city,
            classification,
            nomenclature,
            address,
            protocol,
            status,
            updateCount,
            createdAt,
        ];

        const sql =
            'INSERT INTO sms_operations (company_id, employee_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, used_service_id, used_material_id, finished_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)';

        await executeQuery(sql, values);

        res.json({ success: true });
        console.log('Usuário registrado com sucesso!');
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
