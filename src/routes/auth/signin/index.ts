import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../../config/database';

import { z, ZodError } from 'zod';
import { getRedis } from '../../../config/redis';

const router = express.Router();

const paramsSchema = z.object({
  identification: z.string().refine(value => {
    const isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
    const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
    return isCnpj || isCpf;
  }),
  password: z.string().min(1)
});

interface UserType {
  id: string;
  name: string;
  status: string;
  role: string;
  password: string
}


router.post('/signin', async (req: Request, res: Response) => {
  try {
    const { password, identification } = paramsSchema.parse(req.body);
    const sql = 'SELECT * FROM tbl_user_accounts WHERE identification = ?';
    const [userQuery]= await executeQuery(sql, [identification]);
    const user = { ...userQuery } as UserType;
    
    if (!user) {
      return res.status(401).send('Credenciais inválidas');
    }

    const company = await getRedis('company') ?? 'exatelecom';
    const ssid = await getRedis('_session_ssid') ?? '00000';

    const content = {
      user: {
        id: user.id,
        name: user.name,
        accountStatus: user.status,
        role: user.role,
        company
      },
      ssid
    };

    const isPasswordValid = bcrypt.compareSync(password, user.password);

    if (isPasswordValid) {
      console.log('Login bem-sucedido. Token:');
      if (user.status === 'inactive') {
        return res.status(403).send('forbidden');
      }

      res.json(content);
    } else {
      return res.status(401).send('Credenciais inválidas');
    }
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Requisição inválida Zod', error.errors);
      return res.status(400).json({ error: 'Requisição inválida', details: error.errors });
    } else {
      console.error('Erro interno no servidor:', error);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
});

export default router;
