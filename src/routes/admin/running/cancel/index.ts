import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '../../../../constants';
import { IncrementStockItemQuantityEmployee } from '../../../../models/IncrementStockItemQuantityEmployee'
import { CreateStateModificationHistoryRecord } from '../../../../models/CreateStateModificationHistoryRecord';
import { executeQuery, executeTransaction } from '../../../../database';
import { executeWebsocket } from '../../../../functions/websocket/RUNNING-UPDATE';
import { z, ZodError } from 'zod';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
  employeeId: z.string(),
  protocol: z.string().max(17),
});

interface ServiceData {
  id: number;
  client_name: string;
  employee_id: string;
  admin_id: string;
  city: string;
  address: string;
  nomenclature: string;
  classification: string;
  status: string;
  update_count: number;
  created_at: string;
  modification_at: string;
  finished_at: string;
  list_material: string;
  list_service: string;
  observation: string;
  protocol: string;
}

const executionStatus: Map<string, boolean> = new Map();

router.post('/cancel', async (req: Request, res: Response) => {
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
    const { token, employeeId, protocol } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('Token expirado')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('Token inválido')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const selectSql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?';
      const [row]: ServiceData[] = await executeQuery(selectSql, [employeeId, protocol]);

      if (!row) {
        return res.status(400).json({ error: 'Requisição inválido' });
      }

      if (row.status === 'canceled') {
        return res.status(409).json({ error: 'Serviço já pausado' });
      }

      const executeTransactionArray = [];
      
      const deleteValues = [row.employee_id, row.protocol];
      const queryOperations = 'DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?'
      executeTransactionArray.push({ query: queryOperations, values: deleteValues });

      const newStatus = 'canceled';
      const createStateModificationHistoryRecord = await CreateStateModificationHistoryRecord({ row, newStatus })
      executeTransactionArray.push({ ...createStateModificationHistoryRecord });

      if (row.status === 'analysis') {
        const incrementStockItemQuantityEmployee = await IncrementStockItemQuantityEmployee(row.list_material)
        executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
      }

      await executeTransaction(executeTransactionArray);
      res.json({ success: true });

      await executeWebsocket({ token, employee_id: row.employee_id });
      executionStatus.set(ip, false);
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