import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

import { getAuthenticationHash } from '../../../../functions';
import { executeQuery } from '../../../../config/database';

import { z, ZodError } from 'zod';
import moment from 'moment';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

const paramsSchema = z.object({
  employee_id: z.number().optional(),
  token: z.string(),
  selectedFirstDate: z.string().min(1),
  selectedLastDate: z.string().min(1)
});

router.post('/manage/view_production', async (req: Request, res: Response) => {
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
    const { employee_id, token, selectedFirstDate, selectedLastDate } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

    try {
      console.log('selectedLastDate: ', selectedLastDate);
      console.log('selectedFirstDate: ', selectedFirstDate);

      const firstFormatted = moment(selectedFirstDate)
      .hour(0)   // Define a hora para 00
      .minute(0) // Define os minutos para 00
      .second(0) // Define os segundos para 00
      .format('YYYY-MM-DD HH:mm:ss');
  
    const lastFormatted = moment(selectedLastDate)
      .hour(23)   // Define a hora para 23
      .minute(59) // Define os minutos para 59
      .second(59) // Define os segundos para 59
      .format('YYYY-MM-DD HH:mm:ss');

      const sql1 = `
      SELECT list_service 
      FROM tbl_operations_logs 
      WHERE employee_id = ? 
        AND status = ? 
        AND finished_at >= ? 
        AND finished_at <= ?
      ORDER BY id DESC;
    `;

      const sql2 = 'SELECT * FROM tbl_service_catalog';

      const values = [employee_id, 'concluded', firstFormatted, lastFormatted];

      const currentOperation = await executeQuery(sql1, values);
      const serviceList = await executeQuery(sql2);
      
      res.json({ currentOperation: [...currentOperation], serviceList: serviceList });
      resolve(true);
        }
        catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log('Token expirado');
      return res.status(403).json({ error: 'Token expirado' });
    }

    if (error instanceof JsonWebTokenError) {
      console.log('Token inválido');
      return res.status(403).json({ error: 'Token inválido' });
    }

    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: error.errors });
    }

    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    executionStatus.set(ip, false);
  }
});

export default router;
