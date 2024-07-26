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
const moment_1 = __importDefault(require("moment"));
const router = express_1.default.Router();
const executionStatus = new Map();
const paramsSchema = zod_1.z.object({
    employee_id: zod_1.z.number().optional(),
    token: zod_1.z.string(),
    selectedFirstDate: zod_1.z.string().min(1),
    selectedLastDate: zod_1.z.string().min(1)
});
router.post('/manage/view_production', async (req, res) => {
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
        const { employee_id, token, selectedFirstDate, selectedLastDate } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    console.log('selectedLastDate: ', selectedLastDate);
                    console.log('selectedFirstDate: ', selectedFirstDate);
                    const firstFormatted = (0, moment_1.default)(selectedFirstDate)
                        .hour(0) // Define a hora para 00
                        .minute(0) // Define os minutos para 00
                        .second(0) // Define os segundos para 00
                        .format('YYYY-MM-DD HH:mm:ss');
                    const lastFormatted = (0, moment_1.default)(selectedLastDate)
                        .hour(23) // Define a hora para 23
                        .minute(59) // Define os minutos para 59
                        .second(59) // Define os segundos para 59
                        .format('YYYY-MM-DD HH:mm:ss');
                    const sql1 = `
      SELECT list_service 
      FROM tbl_operations_logs 
      WHERE employee_id = ? 
        AND status = ? 
        AND finished_at >= ? 
        AND finished_at <= ?
      ORDER BY id DESC;
    `;
                    const sql2 = 'SELECT * FROM tbl_service_catalog';
                    const values = [employee_id, 'concluded', firstFormatted, lastFormatted];
                    const currentOperation = await (0, database_1.executeQuery)(sql1, values);
                    const serviceList = await (0, database_1.executeQuery)(sql2);
                    res.json({ currentOperation: [...currentOperation], serviceList: serviceList });
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
