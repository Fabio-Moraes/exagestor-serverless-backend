"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthenticationHash = void 0;
const node_crypto_1 = require("node:crypto");
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("../config/redis");
dotenv_1.default.config();
async function getAuthenticationHash() {
    const salt = process.env.SECRET_SALT;
    const ssid = await (0, redis_1.getRedis)('_session_ssid') ?? '00000';
    return (0, node_crypto_1.createHash)('sha256').update(ssid + salt).digest('hex');
}
exports.getAuthenticationHash = getAuthenticationHash;
