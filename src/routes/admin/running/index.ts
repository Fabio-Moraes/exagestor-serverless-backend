import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import routesFinish from './finish';
import routesCancel from './cancel';
import routesPause from './pause';
import routesStart from './start';
import routesCheck from './check';

import { z, ZodError } from 'zod';

const router = express.Router();

const executionStatus: Map<string, boolean> = new Map();

router.post('/running', async (req: Request, res: Response) => {
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

    const paramsSchema = z.object({ token: z.string() });
    const { token } = paramsSchema.parse(req.body);

    jwt.verify(token, JWT_SECRET_KEY, async (error) => {
      if (error) {
        if (error instanceof TokenExpiredError) {
          console.log('** verify token expired **')
          return res.status(403).json({ error: 'Token expirado' });
        } else {
          console.log('** verify token inválido **')
          return res.status(403).json({ error: 'Token inválido' });
        }
      }

      const sql = `
    -- Selecionar todas as colunas da tabela exa_operations e adicionar informações dos usuários
    SELECT u1.*, 
    -- Alias para o nome do técnico associado à operação
    tec_user.name AS name_tec, 
    -- Alias para o nome do administrador associado à operação
    admin_user.name AS name_admin
    -- Tabela principal sendo referenciada como u1
    FROM exa_operations u1
    -- Junção com a tabela exa_users para obter informações do técnico associado à operação
    JOIN exa_users tec_user
    ON u1.employee_id = tec_user.id 
    -- Junção esquerda com a tabela exa_users para obter informações do administrador associado à operação
    LEFT JOIN exa_users admin_user
    ON u1.admin_id = admin_user.id
    -- Condição para excluir operações com determinados status
    WHERE (u1.status <> ? AND u1.status <> ?)
    -- Condição para garantir que não exista outra operação com o mesmo protocolo e um ID maior
    AND NOT EXISTS (
      SELECT 1
      FROM exa_operations u2
      WHERE u2.protocol = u1.protocol
      AND u2.id > u1.id 
      )
    -- Ordenar o resultado com base na data de criação das operações em ordem decrescente
    ORDER BY u1.created_at DESC;
`;

      const statusCanceled = 'canceled';
      const statusCompleted = 'concluded';

      const rows = await executeQuery(sql, [statusCanceled, statusCompleted]);

      executionStatus.set(ip, false);

      res.json(rows);
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

router.use(routesFinish);
router.use(routesCancel);
router.use(routesPause);
router.use(routesStart);
router.use(routesCheck);

export default router;