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
const details_1 = __importDefault(require("./details"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const executionStatus = new Map();
const paramsSchema = zod_1.z.object({
    employee_all: zod_1.z.boolean().optional(),
    employee_id: zod_1.z.number().optional(),
    initial_id: zod_1.z.number().nullable().optional(),
    token: zod_1.z.string(),
});
router.post('/manage/historic', async (req, res) => {
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
        const { employee_all, employee_id, initial_id, token } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const selectEmployee = async (initial_id, employee_id) => {
                        const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
                        const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
                        if (!initial_id)
                            return await (0, database_1.executeQuery)(sqlFirst, [employee_id]);
                        return await (0, database_1.executeQuery)(sqlLast, [initial_id, employee_id]);
                    };
                    const selectEmployeeAll = async (initial_id) => {
                        const sqlFirst = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
        ORDER BY id DESC
        LIMIT 10;
        `;
                        const sqlLast = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < ?
        ORDER BY id DESC
        LIMIT 10;
        `;
                        if (!initial_id)
                            return await (0, database_1.executeQuery)(sqlFirst);
                        return await (0, database_1.executeQuery)(sqlLast, [initial_id]);
                    };
                    const resultEmployeeAll = await selectEmployeeAll(initial_id);
                    const resultEmployee = await selectEmployee(initial_id, employee_id);
                    res.json(employee_all ? resultEmployeeAll : resultEmployee);
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
router.use(details_1.default);
exports.default = router;
