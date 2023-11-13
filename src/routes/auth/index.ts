import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import bcrypt from 'bcryptjs';
import { JWT_SECRET_KEY } from '../../constants';

import { z } from 'zod';

const router = express.Router();

//-------------------//
//admin
//46.557.719/0001-29
//090807junio
//-------------------//

type User = {
  [key: string]: {
    id: number;
    name: string;
    cnpj: string;
    role: string;
    password: string;
  };
};

const user: User = {
  '00.000.000/0000-00': {
    id: 23,
    name: 'James Junio',
    cnpj: '00.000.000/0000-00',
    role: 'employee',
    password: '$2a$12$vCwoKha2HpLnkUn2IWtxmOar4Caes.uwkKmijHpmwcCy72JvIkRQm' // senha: "senha"
  },

  '22.222.222/2222-22': {
    id: 23,
    name: 'steve jobs',
    cnpj: '22.222.222/2222-22',
    role: 'employee',
    password: '$2a$12$vCwoKha2HpLnkUn2IWtxmOar4Caes.uwkKmijHpmwcCy72JvIkRQm' // senha: "senha"
  },

  '11.111.111/1111-11': {
    id: 22,
    name: 'Fabio Moraes',
    cnpj: '11.111.111/1111-11',
    role: 'admin',
    password: '$2a$12$iMhbhn.ElzkFe17a/X7oeeeQqG2MONnkKgf8a1Kd407Tv6eIIh0qO' // senha: "12345"
  }
};

router.post('/signin', (req: Request, res: Response) => {
  const paramsSchema = z.object({
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    password: z.string().min(1)
  });

  const { password, cnpj } = paramsSchema.parse(req.body);

  // Gerando um token JWT com o id do usuário
  if (bcrypt.compareSync(password, user[cnpj].password)) {
    const token = jwt.sign({ id: user[cnpj].id, name: user[cnpj].name, role: user[cnpj].role }, JWT_SECRET_KEY, { expiresIn: '7d' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciais inválidas');
  }
});

export default router;