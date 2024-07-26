"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const concluded_1 = __importDefault(require("./concluded"));
const select_material_1 = __importDefault(require("./select-material"));
const select_service_1 = __importDefault(require("./select-service"));
const router = express_1.default.Router();
router.use(concluded_1.default);
router.use(select_material_1.default);
router.use(select_service_1.default);
exports.default = router;
