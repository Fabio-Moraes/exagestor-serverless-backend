"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const historic_1 = __importDefault(require("./historic"));
const new_1 = __importDefault(require("./new"));
const running_1 = __importDefault(require("./running"));
const stock_1 = __importDefault(require("./stock"));
const router = express_1.default.Router();
router.use(historic_1.default);
router.use(new_1.default);
router.use(running_1.default);
router.use(stock_1.default);
exports.default = router;
