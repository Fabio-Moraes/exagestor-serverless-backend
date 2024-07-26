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
const CreateProtocol_1 = require("../../../utils/CreateProtocol");
const functions_1 = require("../../../functions");
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
const websocket_1 = require("../../../config/websocket");
function getCurrentDateTime(date) {
    const now = date ? new Date(date) : new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
const router = express_1.default.Router();
const paramsSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1).regex(/^[^0-9]*$/),
    city: zod_1.z.string().min(1).regex(/^[^0-9]*$/),
    classification: zod_1.z.string().min(1).max(2),
    nomenclature: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    startServiceAt: zod_1.z.string().refine((dateString) => {
        const currentDate = new Date();
        const inputDate = new Date(dateString);
        currentDate.setHours(0, 0, 0, 0);
        inputDate.setHours(0, 0, 0, 0);
        return inputDate >= currentDate;
    }, {
        message: 'A data de início do serviço não pode ser anterior à data atual',
    }),
    token: zod_1.z.string()
});
const executionStatus = new Map();
router.post('/new', async (req, res) => {
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
        const { clientName, city, classification, nomenclature, address, startServiceAt, token } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const createdAt = getCurrentDateTime();
                    const getStartServiceAt = getCurrentDateTime(startServiceAt);
                    const protocol = (0, CreateProtocol_1.createProtocol)(17);
                    const status = 'active';
                    const updateCount = 0;
                    const { user: employee } = decoded;
                    const values = [
                        protocol,
                        employee.id,
                        null,
                        clientName,
                        city,
                        classification,
                        nomenclature,
                        address,
                        status,
                        updateCount,
                        getStartServiceAt,
                        null,
                        null,
                        null,
                        createdAt,
                        null,
                        null,
                    ];
                    const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
                    const queryOperationsHistory = `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count,
          start_service_at, 
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
                    await (0, database_1.executeTransaction)([
                        { query: queryOperations, values: values },
                        { query: queryOperationsHistory, values: values }
                    ]);
                    const socket = await (0, websocket_1.websocket)(token);
                    socket.emit('RUNNING_REFRESH', JSON.stringify({ employee_id: String(employee.id) }));
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
