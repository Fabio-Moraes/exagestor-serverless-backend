import Redis from 'ioredis';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USER,
  REDIS_PASSWORD,
  REDIS_TLS_REJECT_UNAUTHORIZED
} = process.env;

if (!REDIS_HOST || !REDIS_PORT || isNaN(Number(REDIS_PORT)) || !REDIS_USER || !REDIS_PASSWORD) {
  throw new Error('As variáveis de ambiente do Redis não estão configuradas corretamente.');
}

const redisClient = new Redis({
  host: REDIS_HOST,
  username: REDIS_USER,
  password: REDIS_PASSWORD,
  port: Number(REDIS_PORT),
  retryStrategy: (times) => Math.min(times * 50, 2000),
  ...(REDIS_TLS_REJECT_UNAUTHORIZED === 'true' && {
    tls: { servername: REDIS_HOST }
  }),
});

/* 
const redisClient = new Redis({
  username: 'default',
  host: 'caching-exagestor-exagestor.h.aivencloud.com',
  password: 'AVNS_GQ4UU9Znkc6NkAMKdEj',
  port: 19380,
  tls: {
    servername: 'caching-exagestor-exagestor.h.aivencloud.com'
  }
}
);
*/

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