"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const functions_1 = require("../../../../functions");
const database_1 = require("../../../../config/database");
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const operations_1 = require("../../../../models/operations");
const operation_logs_1 = require("../../../../models/operation_logs");
const websocket_1 = require("../../../../config/websocket");
dotenv_1.default.config();
const router = express_1.default.Router();
const paramsSchema = zod_1.z.object({
    token: zod_1.z.string(),
    protocol: zod_1.z.string().max(17),
});
const executionStatus = new Map();
router.post('/running/pause', async (req, res) => {
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
        const { token, protocol } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const { user } = decoded;
                    const selectSql = 'SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?';
                    const [row] = await (0, database_1.executeQuery)(selectSql, [user.id, protocol, 'active']);
                    if (!row) {
                        return res.status(400).json({ error: 'Requisição inválido' });
                    }
                    const newStatus = 'paused';
                    const updateStateModificationService = await (0, operations_1.update_state_modification)({ row, newStatus });
                    const createStateModificationHistoryRecord = await (0, operation_logs_1.insert_state_modification)({ row, newStatus });
                    await (0, database_1.executeTransaction)([
                        { ...updateStateModificationService },
                        { ...createStateModificationHistoryRecord }
                    ]);
                    const socket = await (0, websocket_1.websocket)(token);
                    socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: row.employee_id }));
                    res.json({ success: true });
                    resolve(true);
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.TokenExpiredError) {
            console.log('Token expirado');
            return res.status(403).json({ error: 'Token expirado' });
        }
        if (error instanceof jsonwebtoken_1.JsonWebTokenError) {
            console.log('Token inválido');
            return res.status(403).json({ error: 'Token inválido' });
        }
        if (error instanceof zod_1.ZodError) {
            console.error('Requisição inválida Zod', error.errors);
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
    finally {
        executionStatus.set(ip, false);
    }
});
exports.default = router;
