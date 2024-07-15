import Redis from 'ioredis';
import { promisify } from 'util';

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

function getRedis(value: string) {
 const sysncRedisGet = promisify(redisClient.get).bind(redisClient);
 return sysncRedisGet(value)
}

function setRedis(key: string, value: string) {
  const sysncRedisSet = promisify(redisClient.set).bind(redisClient);
  return sysncRedisSet(key, value)
 }

export { redisClient, getRedis, setRedis}