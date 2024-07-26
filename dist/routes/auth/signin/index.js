"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../../../config/database");
const zod_1 = require("zod");
const redis_1 = require("../../../config/redis");
const router = express_1.default.Router();
const paramsSchema = zod_1.z.object({
    identification: zod_1.z.string().refine(value => {
        const isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
        const isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
        return isCnpj || isCpf;
    }),
    password: zod_1.z.string().min(1)
});
router.post('/signin', async (req, res) => {
    try {
        const { password, identification } = paramsSchema.parse(req.body);
        const sql = 'SELECT * FROM tbl_user_accounts WHERE identification = ?';
        const [userQuery] = await (0, database_1.executeQuery)(sql, [identification]);
        const user = userQuery;
        if (!user) {
            return res.status(401).send('Credenciais inválidas');
        }
        const company = await (0, redis_1.getRedis)('company') ?? 'exatelecom';
        const ssid = await (0, redis_1.getRedis)('_session_ssid') ?? '00000';
        const content = {
            user: {
                id: user.id,
                name: user.name,
                accountStatus: user.status,
                role: user.role,
                company
            },
            ssid
        };
        const isPasswordValid = bcryptjs_1.default.compareSync(password, user.password);
        if (isPasswordValid) {
            console.log('Login bem-sucedido. Token:');
            if (user.status === 'inactive') {
                return res.status(403).send('forbidden');
            }
            res.json(content);
        }
        else {
            return res.status(401).send('Credenciais inválidas');
        }
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            console.error('Requisição inválida Zod', error.errors);
            return res.status(400).json({ error: 'Requisição inválida', details: error.errors });
        }
        else {
            console.error('Erro interno no servidor:', error);
            return res.status(500).json({ error: 'Erro interno no servidor.' });
        }
    }
});
exports.default = router;
