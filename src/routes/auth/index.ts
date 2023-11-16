import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';
import { JWT_SECRET_KEY } from '../../constants';

import { executeQuery } from '../../database';

import { z, ZodError } from 'zod';

const router = express.Router();

//-------------------//
//admin
//46.557.719/0001-29
//090807junio
//-------------------//

interface Company {
  [key: string]: {
    id: number;
    name: string;
    cnpj: string;
  };
};

interface User {
  [key: string]: {
    id: number;
    company_id: number;
    name: string;
    cnpj: string;
    role: string;
    password: string;
  };
};

const company: Company = {
  '0': {
    id: 0,
    name: 'Exa Telecom',
    cnpj: '00.000.000/0000-00'
  },

  '1': {
    id: 1,
    name: 'Exa Telecom',
    cnpj: '00.000.000/0000-00'
  }
}


const user: User = {
  '00.000.000/0000-00': {
    id: 0,
    company_id: 1,
    name: 'James Junio',
    cnpj: '00.000.000/0000-00',
    role: 'admin',
    password: '$2a$12$vCwoKha2HpLnkUn2IWtxmOar4Caes.uwkKmijHpmwcCy72JvIkRQm' // senha: "senha"
  },

  '11.111.111/1111-11': {
    id: 1,
    company_id: 1,
    name: 'Ichigo Kurosaki',
    cnpj: '11.111.111/1111-11',
    role: 'employee',
    password: '$2a$12$iMhbhn.ElzkFe17a/X7oeeeQqG2MONnkKgf8a1Kd407Tv6eIIh0qO' // senha: "12345"
  },

  '22.222.222/2222-22': {
    id: 2,
    company_id: 1,
    name: 'Naruto Uzumaki',
    cnpj: '22.222.222/2222-22',
    role: 'employee',
    password: '$2a$12$vCwoKha2HpLnkUn2IWtxmOar4Caes.uwkKmijHpmwcCy72JvIkRQm' // senha: "senha"
  }
};

router.post('/signin', async (req: Request, res: Response) => {
  try {
    const paramsSchema = z.object({
      cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
      password: z.string().min(1)
    });

    const { password, cnpj } = paramsSchema.parse(req.body);

    const sql = `SELECT * FROM sms_users WHERE cnpj = ?`;
    const rows = await executeQuery(sql, [cnpj]);

    const contentJwt = {
      user: {
        id: rows[0].id,
        name: rows[0].name,
        role: rows[0].role,
      },
      company: {
        id: rows[0].company_id,
        name: 'Exa Telecom'
      }
    }

    // Gerando um token JWT com o id do usuário
    if (bcrypt.compareSync(password, rows[0].password)) {
      const token = jwt.sign(contentJwt, JWT_SECRET_KEY, { expiresIn: '7d' });
      res.json({ token });
    } else {
      res.status(401).send('Credenciais inválidas');
    }

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
