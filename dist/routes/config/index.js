"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const select_theme_1 = __importDefault(require("./select-theme"));
const disconnect_everything_1 = __importDefault(require("./disconnect-everything"));
const router = express_1.default.Router();
router.use(select_theme_1.default);
router.use(disconnect_everything_1.default);
exports.default = router;
