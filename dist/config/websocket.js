"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocket = void 0;
const socket_io_client_1 = require("socket.io-client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function websocket(token) {
    const cookies = new Map();
    cookies.set('auth_token', token);
    const socket = (0, socket_io_client_1.io)(String(process.env.WEBSOCKET_SERVER_BASEURL), {
        transports: ['websocket'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        extraHeaders: {
            'Origin': String(process.env.BACKEND_ORIGIN_BASEURL),
            'Cookie': Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ')
        },
    });
    return new Promise((resolve, reject) => {
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            resolve(socket);
        });
        socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            reject(error);
        });
    });
}
exports.websocket = websocket;
