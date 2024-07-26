"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stock_1 = __importDefault(require("./stock"));
const manage_1 = __importDefault(require("./manage"));
const register_material_1 = __importDefault(require("./register-material"));
const historic_1 = __importDefault(require("./historic"));
const stock_view_1 = __importDefault(require("./stock-view"));
const router = express_1.default.Router();
router.use(stock_1.default);
router.use(manage_1.default);
router.use(register_material_1.default);
router.use(historic_1.default);
router.use(stock_view_1.default);
exports.default = router;
