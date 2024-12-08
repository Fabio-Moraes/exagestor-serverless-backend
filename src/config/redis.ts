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

const redisClient = new Redis({
  username: REDIS_USER,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: Number(REDIS_PORT),
  maxRetriesPerRequest: 5, // Número máximo de tentativas por solicitação
  connectTimeout: 10000, // Tempo máximo para estabelecer uma conexão (em milissegundos)
  retryStrategy: (times) => Math.min(times * 50, 2000), // Estratégia de retry
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Reconectar em caso de erro READONLY
    }
    return false;
  },
  ...(REDIS_TLS_REJECT_UNAUTHORIZED === 'true' && {
    tls: { servername: REDIS_HOST }
  }),
});
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