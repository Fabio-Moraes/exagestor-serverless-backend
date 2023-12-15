import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
//import type { Decoded } from '../../../../types/jwt'

import { JWT_SECRET_KEY } from '../../../../constants';
import { executeQuery } from '../../../../database';
import { websocket } from '../../../../services/websocket'

import { z, ZodError } from 'zod';

const router = express.Router();

router.get('/pause', async (req: Request, res: Response) => {
  try {
    const customFormatRegex = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

    const paramsSchema = z.object({
      token: z.string(),
      employeeId: z.string().min(1),
      protocol: z.string().refine((data) => customFormatRegex.test(data)).optional(),
    });

    const { token, employeeId, protocol } = paramsSchema.parse(req.query);

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

      //const { user: admin } = decoded as Decoded;

      const selectSql = 'SELECT * FROM exa_operations WHERE employee_id = ? AND protocol = ? ORDER BY id DESC';

      const rows = await executeQuery(selectSql, [employeeId, protocol]);

      if (!rows) {
        console.log('Requisição inválido')
        return res.status(400).json({ error: 'Requisição inválido' });
      }

      if (rows[0].status === 'paused') {
        console.log('Serviço já pausado')
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
      const newStatus = 'paused';

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
        'INSERT INTO exa_operations (employee_id, admin_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, used_service_id, used_material_id, finished_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)';

      await executeQuery(insertSql, values);

      let socket = websocket(token);
  
      const connectSocket = () => {
        socket = websocket(token);
        socket.on('connect', () => {
          console.log('Connected to WebSocket server');
        });
        socket.emit('RUNNING_UPDATE', JSON.stringify({ employee_id: rows[0].employee_id }));
      };

      let retryCount = 0;
      const maxRetries = 5; // You can adjust the number of retries as needed

      const retrySocketConnection = () => {
        retryCount += 1;

        if (retryCount <= maxRetries) {
          console.log(`Retrying socket connection, attempt ${retryCount}`);
          connectSocket();
          setTimeout(retrySocketConnection, 5000); // Adjust the timeout as needed (in milliseconds)
        } else {
          console.log('Max retries reached. Could not establish socket connection.');
          res.status(500).json({ error: 'Could not establish socket connection' });
        }
      };

      connectSocket(); // Initial connection attempt
      retrySocketConnection(); // Start the retry mechanism

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
