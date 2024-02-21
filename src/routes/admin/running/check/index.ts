import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery } from '../../../../database';

import { executeWebsocket } from '../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();

const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

const paramsSchema = z.object({
  token: z.string(),
  employeeId: z.string().min(1),
  protocol: z.string().regex(customFormatRegex),
  observation: z.string().max(500).optional()
});

const executionStatus: Map<string, boolean> = new Map();

router.post('/checked', async (req: Request, res: Response) => {
  const ip = req.ip;

  if (!ip) {
    console.error('IP não fornecido');
    return res.status(409).json({ error: 'IP não fornecido' });
  }

  if (executionStatus.has(ip) && executionStatus.get(ip) === true) {
    console.error('Já existe uma execução em andamento para este IP');
    return res.status(409).json({ error: 'Já existe uma execução em andamento para este IP' });
  }

  try {
    executionStatus.set(ip, true);

    const { token, employeeId, protocol, observation } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error, decoded) => {
      if (error) {
        console.error(error instanceof TokenExpiredError ? 'Token expirado' : 'Token inválido');
        return res.status(403).json({ error: error instanceof TokenExpiredError ? 'Token expirado' : 'Token inválido' });
      }

      const rowSql = `SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? ORDER BY id DESC`;

      const [row] = await executeQuery(rowSql, [employeeId, protocol]);

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
        row.admin_id,
        row.client_name,
        row.city,
        row.classification,
        row.nomenclature,
        row.address,
        row.protocol,
        'concluded',
        row.update_count + 1,
        row.created_at,
        row.modification_at,
        row.list_service,
        row.list_material,
        observation,
        formattedDate
      ];

      const insertSql = 'INSERT INTO exa_operations ( employee_id, admin_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, list_service, list_material, observation, finished_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

      await executeQuery(insertSql, values);
      await executeWebsocket({ token, employee_id: row.employee_id });

      executionStatus.set(ip, false);

      res.json({ success: true });
    });
  } catch (error) {
    executionStatus.set(ip, false);

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