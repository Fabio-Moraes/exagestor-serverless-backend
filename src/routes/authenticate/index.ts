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

const mockUser = {
  id: 23,
  name: 'James Junio',
  cnpj: '00.000.000/0000-00',
  password: '$2a$12$vCwoKha2HpLnkUn2IWtxmOar4Caes.uwkKmijHpmwcCy72JvIkRQm', // senha: "senha"
};

router.post('/signin', (req: Request, res: Response) => {
  const paramsSchema = z.object({
    cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    password: z.string().min(1)
  });

  const { password, cnpj } = paramsSchema.parse(req.body);

  // Gerando um token JWT com o id do usuário
  if (cnpj === mockUser.cnpj && bcrypt.compareSync(password, mockUser.password)) {
    const token = jwt.sign({ id: mockUser.id, name: mockUser.name }, JWT_SECRET_KEY, { expiresIn: '7d' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciais inválidas');
  }
});

export default router;