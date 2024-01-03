import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import type { Decoded } from '../../../types/jwt'
import bcrypt from 'bcryptjs';

import { JWT_SECRET_KEY } from '../../../constants';
import { executeQuery } from '../../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({
      name: z.string().min(1).regex(/^[^0-9]*$/),
      identification: z.string().refine(value => {
        const isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
        const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
        return isCnpj || isCpf;
      }),
      password: z.string().min(1),
      token: z.string()
    });

    const {
      name,
      identification,
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

      const { user } = decoded as Decoded;

      const hash = bcrypt.hashSync(password, 10)

      const values = [
        name,
        'tec',
        identification,
        hash,
        createdAt,
      ];

      const sqlSelect = 'SELECT * FROM exa_users WHERE identification = ?';

      const rows = await executeQuery(sqlSelect, [ identification]);

      if (rows.length > 0) {
        res.json({ status: 'already registered' });
        console.log('Funcionário(a) não registrado!');
        return;
      }

      const sqlInsert = `INSERT INTO exa_users ( name, role, identification, password, created_at) VALUES ( ?, ?, ?, ?, ?)`;

      await executeQuery(sqlInsert, values);

      res.json({ status: 'success' });
      console.log('Funcionário(a) registrado com sucesso!');
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