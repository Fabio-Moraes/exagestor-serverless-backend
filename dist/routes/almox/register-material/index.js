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
const material_operation_1 = require("../../../models/stock_logs/material_operation");
const functions_1 = require("../../../functions");
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
const router = express_1.default.Router();
const onlyNumbers = /^\d+$/;
const noSpaces = /^\S*$/;
const paramsSchema = zod_1.z.object({
    productName: zod_1.z.string().min(1).toUpperCase().trim(),
    productBatch: zod_1.z.string().toUpperCase().regex(noSpaces).nullable(),
    productCode: zod_1.z.string().min(1).regex(noSpaces).regex(onlyNumbers),
    quantityValue: zod_1.z.string().min(1).regex(noSpaces).regex(onlyNumbers),
    unitType: zod_1.z.enum(['UNID', 'CX', 'METRO']),
    observation: zod_1.z.string().max(500).nullable(),
    token: zod_1.z.string()
});
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
const executionStatus = new Map();
router.post('/register-material', async (req, res) => {
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
        const { productName, productCode, productBatch, quantityValue, unitType, observation, token } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const createdAt = getCurrentDateTime();
                    const values = [
                        productName,
                        productCode,
                        productBatch,
                        quantityValue,
                        unitType,
                        observation,
                        createdAt
                    ];
                    const sqlSelect = 'SELECT * FROM tbl_stock_almox WHERE product_code = ?';
                    const rows = await (0, database_1.executeQuery)(sqlSelect, [productCode]);
                    if (rows.length > 0) {
                        res.json({ status: 'already registered' });
                        console.log('Produto já registrado!');
                        return;
                    }
                    const obj = {
                        product_name: productName,
                        unit_type: unitType,
                        product_code: productCode,
                        product_batch: productBatch,
                        quantity_value: quantityValue,
                        created_at: createdAt,
                    };
                    const { user: employee } = decoded;
                    const queryMaterialsStockOperationLog = await (0, material_operation_1.material_operation)({
                        insert: [obj], employeeId: employee.id, transferType: 'sent'
                    });
                    const queryMaterialsStockRegister = 'INSERT INTO tbl_stock_almox ( product_name, product_code, product_batch, quantity_value, unit_type, observation, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ? )';
                    await (0, database_1.executeTransaction)([
                        { query: queryMaterialsStockRegister, values: values },
                        { ...queryMaterialsStockOperationLog }
                    ]);
                    res.json({ status: 'success' });
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
