import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery } from '../../../../database';

import { executeWebsocket } from '../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/start', async (req: Request, res: Response) => {
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

    const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

    const paramsSchema = z.object({
      token: z.string(),
      employeeId: z.string().min(1),
      protocol: z.string().refine((data) => customFormatRegex.test(data)).optional(),
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
          console.log('Token expirado')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('Token inválido')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const selectSql = 'SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? ORDER BY id DESC';
      const rows = await executeQuery(selectSql, [employeeId, protocol]);

      if (!rows) {
        console.log('Requisição inválido')
        return res.status(400).json({ error: 'Requisição inválido' });
      }

      if (rows[0].status === 'active') {
        console.log('Serviço já inicializado')
        return res.status(409).json({ error: 'Serviço já pausado' });
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');

      const newModificationAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      const newStatus = 'active';

      const values = [
        rows[0].employee_id,
        rows[0].admin_id,
        rows[0].client_name,
        rows[0].city,
        rows[0].classification,
        rows[0].nomenclature,
        rows[0].address,
        rows[0].protocol,
        newStatus,
        rows[0].update_count + 1,
        rows[0].created_at,
        newModificationAt
      ];

      const insertSql =
        'INSERT INTO exa_operations (employee_id, admin_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, list_service, list_material, finished_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)';

      await executeQuery(insertSql, values);
      await executeWebsocket({ token, employee_id: rows[0].employee_id });

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