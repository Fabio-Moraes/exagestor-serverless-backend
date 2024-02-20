import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../../../constants';
import { executeQuery, executeTransaction } from '../../../../../database';

import { executeWebsocket } from '../../../../../functions/websocket/RUNNING-UPDATE';

import { z, ZodError } from 'zod';

const router = express.Router();
const isProtocol = /^[0-9]-\d{4}-\d{4}-\d{4}-\d{4}$/;

const paramsSchema = z.object({
    token: z.string().min(1),
    employeeId: z.string().min(1),
    protocol: z.string().regex(isProtocol),
    observation: z.string().max(500).optional(),
    listService: z.string(),
    listMaterial: z.string()
});

function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateQueryListMaterial(arr: string[]) {
  const placeholders = arr.map(() => '?').join(', ');
  return `SELECT * FROM exa_stock_employee WHERE id IN (${placeholders})`;
}

function generatePlaceholders(data: Object[]) {
  const placeholders = data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  return placeholders;
}

router.post('/concluded', async (req: Request, res: Response) => {
    try {
        const { token, employeeId, protocol, observation, listService, listMaterial } = paramsSchema.parse(req.body);

        if (!token || !protocol) {
            console.error('Token ou Protocol não fornecidos');
            return res.status(401).json({ error: 'Token ou Protocol não fornecidos' });
        }

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

            const createdAt = getCurrentDateTime();

            const valuesInsertOperations = [
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
                listService,
                listMaterial,
                observation,
                createdAt
            ];

            const queryOperations = 'INSERT INTO exa_operations ( employee_id, admin_id, client_name, city, classification, nomenclature, address, protocol, status, update_count, created_at, modification_at, list_service, list_material, observation, finished_at) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        
            const transaction = [];
            
            if (row.status === 'active') {
            const requestListMaterial = JSON.parse(listMaterial );
            const listMaterialKeys = Object.keys(requestListMaterial);
      
            const queryListMaterial = generateQueryListMaterial(listMaterialKeys);
            const selectQueryListMaterial = await executeQuery(queryListMaterial, listMaterialKeys);
      
            const resultQueryListMaterial = selectQueryListMaterial.map(items => {
              return { ...items, quantity_value: items.quantity_value - requestListMaterial[items.id] }
            });

            const updateValueMaterialsEmployee:  Array<number | string | null>  = [];

            resultQueryListMaterial.forEach(item => {
              updateValueMaterialsEmployee.push(
                item.id,
                item.employee_id,
                item.product_name,
                item.product_code,
                item.product_batch,
                requestListMaterial[item.id],
                item.unit_type,
                createdAt
              );
            });
      
            const queryMaterialsEmployee = `
            INSERT INTO exa_stock_employee 
              (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
            VALUES ${generatePlaceholders(resultQueryListMaterial)}
            ON DUPLICATE KEY UPDATE 
              id = VALUES(id),
              employee_id = VALUES(employee_id),
              product_name = VALUES(product_name), 
              product_code = VALUES(product_code),
              product_batch = VALUES(product_batch),
              quantity_value = quantity_value - VALUES(quantity_value),
              unit_type = VALUES(unit_type),
              created_at = VALUES(created_at);
            `;

          
              transaction.push({ query: queryMaterialsEmployee, values: updateValueMaterialsEmployee });
            }
            
            transaction.push({ query: queryOperations, values: valuesInsertOperations });
            
            await executeTransaction(transaction);
            await executeWebsocket({ token, employee_id: row.employee_id });

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