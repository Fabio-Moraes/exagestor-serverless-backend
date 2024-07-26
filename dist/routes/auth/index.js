"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const signin_1 = __importDefault(require("./signin"));
const data_user_1 = __importDefault(require("./data_user"));
const router = express_1.default.Router();
router.use(signin_1.default);
router.use(data_user_1.default);
exports.default = router;
