"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProtocol = void 0;
const crypto_1 = __importDefault(require("crypto"));
function createProtocol(length) {
    const randomBuffer = crypto_1.default.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
        code += randomBuffer[i] % 10;
    }
    return code;
}
exports.createProtocol = createProtocol;
