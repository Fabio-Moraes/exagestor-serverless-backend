"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const manage_1 = __importDefault(require("./manage"));
const running_1 = __importDefault(require("./running"));
const register_employee_1 = __importDefault(require("./register-employee"));
const register_service_1 = __importDefault(require("./register-service"));
const router = express_1.default.Router();
router.use(manage_1.default);
router.use(running_1.default);
router.use(register_employee_1.default);
router.use(register_service_1.default);
exports.default = router;
