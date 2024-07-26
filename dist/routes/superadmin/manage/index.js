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
const functions_1 = require("../../../functions");
const database_1 = require("../../../config/database");
const new_1 = __importDefault(require("./new"));
const historic_1 = __importDefault(require("./historic"));
const update_password_employee_1 = __importDefault(require("./update_password_employee"));
const update_status_employee_1 = __importDefault(require("./update_status_employee"));
const view_production_1 = __importDefault(require("./view_production"));
const service_enabler_and_disabler_1 = __importDefault(require("./service-enabler-and-disabler"));
const zod_1 = require("zod");
const router = express_1.default.Router();
const paramsSchema = zod_1.z.object({ token: zod_1.z.string() });
const executionStatus = new Map();
router.post('/manage', async (req, res) => {
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
        const { token } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
                    const roles = ['superadmin', 'admin', 'almox', 'cop', 'config'];
                    const rows = await (0, database_1.executeQuery)(sql, roles);
                    res.json(rows);
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
router.use(new_1.default);
router.use(historic_1.default);
router.use(view_production_1.default);
router.use(update_password_employee_1.default);
router.use(update_status_employee_1.default);
router.use(service_enabler_and_disabler_1.default);
exports.default = router;
