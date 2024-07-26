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
const material_operation_1 = require("../../../../models/stock_logs/material_operation");
const zod_1 = require("zod");
const router = express_1.default.Router();
const insertedMaterialSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().min(1),
    product_name: zod_1.z.string(),
    unit_type: zod_1.z.string(),
    product_code: zod_1.z.string(),
    product_batch: zod_1.z.string().nullable(),
    quantity_value: zod_1.z.string(),
    created_at: zod_1.z.string(),
}));
const paramsSchema = zod_1.z.object({
    insert: insertedMaterialSchema,
    employee_id: zod_1.z.number(),
    token: zod_1.z.string(),
});
function generatePlaceholders(count, insert) {
    let valueQuery = '';
    const placeholders = Array(count).fill('?').join(', ');
    for (let i = 0; i < insert.length; i++) {
        const valueSql = `(${placeholders})`;
        valueQuery += valueSql;
        if (i < insert.length - 1) {
            valueQuery += ', ';
        }
    }
    return valueQuery;
}
function getBeforeHyphen(text) {
    const parts = text.split('-');
    return Number(parts[0]);
}
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
router.post('/manage/pick-material', async (req, res) => {
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
        const { insert, employee_id, token } = paramsSchema.parse(req.body);
        const authenticationHash = await (0, functions_1.getAuthenticationHash)();
        await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, authenticationHash, async (error, decoded) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const createdAt = getCurrentDateTime();
                    const updateValuesMaterialsStock = [];
                    insert.forEach(item => {
                        updateValuesMaterialsStock.push(getBeforeHyphen(item.id), item.product_name, item.product_code, item.product_batch, item.quantity_value, item.unit_type, createdAt);
                    });
                    const insertValueMaterialsEmployee = [];
                    insert.forEach(item => {
                        insertValueMaterialsEmployee.push(item.id, employee_id, item.product_name, item.product_code, item.product_batch, item.quantity_value, item.unit_type, createdAt);
                    });
                    const queryMaterialsStock = `
      INSERT INTO tbl_stock_almox 
        (id, product_name, product_code, product_batch, quantity_value, unit_type, created_at) 
      VALUES 
        ${generatePlaceholders(7, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value + VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
                    const queryMaterialsEmployee = `
      INSERT INTO tbl_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
      VALUES ${generatePlaceholders(8, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
                    const queryMaterialsStockTransferLog = await (0, material_operation_1.material_operation)({
                        insert, employeeId: employee_id, transferType: 'sent'
                    });
                    await (0, database_1.executeTransaction)([
                        { query: queryMaterialsStock, values: updateValuesMaterialsStock },
                        { query: queryMaterialsEmployee, values: insertValueMaterialsEmployee },
                        { ...queryMaterialsStockTransferLog }
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
