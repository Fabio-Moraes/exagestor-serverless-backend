"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRedis = exports.getRedis = exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const util_1 = require("util");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { REDIS_HOST, REDIS_PORT, REDIS_USER, REDIS_PASSWORD, REDIS_TLS_REJECT_UNAUTHORIZED } = process.env;
const redisClient = new ioredis_1.default({
    username: REDIS_USER,
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
    port: Number(REDIS_PORT),
    retryStrategy: (times) => Math.min(times * 50, 2000),
    ...(REDIS_TLS_REJECT_UNAUTHORIZED === 'true' && {
        tls: { servername: REDIS_HOST }
    }),
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});
redisClient.on('connect', () => {
    console.log('Conectado ao Redis');
});
redisClient.on('reconnecting', (delay) => {
    console.log(`Tentando reconectar ao Redis em ${delay}ms`);
});
function getRedis(value) {
    const sysncRedisGet = (0, util_1.promisify)(redisClient.get).bind(redisClient);
    return sysncRedisGet(value);
}
exports.getRedis = getRedis;
function setRedis(key, value) {
    const sysncRedisSet = (0, util_1.promisify)(redisClient.set).bind(redisClient);
    return sysncRedisSet(key, value);
}
exports.setRedis = setRedis;
