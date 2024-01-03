import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery } from '../../../../../database';
import { executeWebsocket } from '../../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();

const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

const paramsSchema = z.object({
  token: z.string().min(1),
  protocol: z.string().refine(data => customFormatRegex.test(data)),
  observation: z.string().max(500).optional(),
  serviceIds: z.string(),
});

router.post('/concluded', async (req: Request, res: Response) => {
  try {
    const { token, protocol, observation, serviceIds } = paramsSchema.parse(req.body);

    if (!token || !protocol) {
      console.error('Token ou Protocol não fornecidos');
      return res.status(401).json({ error: 'Token ou Protocol não fornecidos' });
    }

    jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        console.error(error instanceof TokenExpiredError ? 'Token expirado' : 'Token inválido');
        return res.status(403).json({ error: error instanceof TokenExpiredError ? 'Token expirado' : 'Token inválido' });
      }

      const { user } = decoded as Decoded

      const [row] = await executeQuery('SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? ORDER BY id DESC', [user.id, protocol]);

      if (!row) {
        console.error('Requisição inválida');
        return res.status(400).json({ error: 'Requisição inválida' });
      }

      if (row.status === 'concluded') {
        console.error('Serviço já concluído');
        return res.status(409).json({ error: 'Serviço já concluído' });
      }

      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

      const values = [
        row.employee_id,
        row.client_name,
        row.city,
        row.classification,
        row.nomenclature,
        row.address,
        row.protocol,
        'analysis',
        row.update_count + 1,
        row.created_at,
        row.modification_at,
        row.used_service_id,
        row.used_material_id,
        observation,
        formattedDate
      ];

      const insertSql = 'INSERT INTO exa_operations ( employee_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, used_service_id, used_material_id, observation, finished_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

      await executeQuery(insertSql, values);
      await executeWebsocket({ token, employee_id: row.employee_id, });

      res.json({ success: true });
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