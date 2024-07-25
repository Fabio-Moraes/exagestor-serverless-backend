import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import { getRedis } from '../config/redis';

dotenv.config();

export async function getAuthenticationHash() {
  const salt = process.env.SECRET_SALT;
  const ssid = await getRedis('_session_ssid') ?? '00000';
  return createHash('sha256').update(ssid + salt).digest('hex');
}
