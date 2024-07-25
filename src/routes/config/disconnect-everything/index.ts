import express, { Request, Response } from 'express';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { getAuthenticationHash } from '../../../functions';
import { setRedis } from '../../../config/redis';
import { z, ZodError } from 'zod';
import { websocket } from '../../../config/websocket';
import { Socket } from 'socket.io-client';

const router = express.Router();

const paramsSchema = z.object({
  token: z.string(),
});

const executionStatus: Map<string, boolean> = new Map();

function getRandomSSID(comprimento = 10) {
  return Math.random().toString(36).slice(2, comprimento);
}

router.post('/disconnect-everything', async (req: Request, res: Response) => {
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
    const { token } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();

    await new Promise((resolve, reject) => {
      jwt.verify(token, authenticationHash, async (error, decoded) => { // eslint-disable-line  
        if (error) {
          reject(error);
          return;
        }

        try {
          const ssid = getRandomSSID();
          await setRedis('_session_ssid', ssid);

          const socket = await websocket(token) as Socket;
          socket.emit('ALL_REMOTE_LOGOUT_USER');
          res.json({ success: true });
          socket.close();
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