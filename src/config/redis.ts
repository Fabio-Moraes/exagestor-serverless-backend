import Redis from 'ioredis';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

if (isNaN(Number(process.env.REDIS_PORT))) {
  throw new Error('Port is not a valid number');
}

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASSWORD,
  port: Number(process.env.REDIS_PORT),
  retryStrategy: (times) => Math.min(times * 50, 2000),
  ...(process.env.REDIS_TLS_REJECT_UNAUTHORIZED === 'true' && {
    tls: { servername: process.env.REDIS_HOST }
  }),
}
);

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Conectado ao Redis');
});

redisClient.on('reconnecting', (delay: number) => {
  console.log(`Tentando reconectar ao Redis em ${delay}ms`);
});

function getRedis(value: string) {
  const sysncRedisGet = promisify(redisClient.get).bind(redisClient);
  return sysncRedisGet(value);
}

function setRedis(key: string, value: string) {
  const sysncRedisSet = promisify(redisClient.set).bind(redisClient);
  return sysncRedisSet(key, value);
}

export { redisClient, getRedis, setRedis };