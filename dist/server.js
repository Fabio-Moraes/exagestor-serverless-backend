"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const tec_1 = __importDefault(require("./routes/tec"));
const admin_1 = __importDefault(require("./routes/admin"));
const superadmin_1 = __importDefault(require("./routes/superadmin"));
const config_1 = __importDefault(require("./routes/config"));
const cop_1 = __importDefault(require("./routes/cop"));
const auth_1 = __importDefault(require("./routes/auth"));
const almox_1 = __importDefault(require("./routes/almox"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const frontendOriginBaseURL = process.env.FRONTEND_ORIGIN_BASEURL;
app.use((0, cookie_parser_1.default)());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', frontendOriginBaseURL);
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use((0, cors_1.default)({
    origin: frontendOriginBaseURL,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/api/tec', tec_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/superadmin', superadmin_1.default);
app.use('/api/config', config_1.default);
app.use('/api/cop', cop_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/almox', almox_1.default);
app.use((err, req, res) => {
    console.error(err.stack);
    res.status(500).send('Ocorreu um erro interno.');
});
const PORT = Number(process.env.PORT);
const ASCIIART = `%c 
       ######   ########   ########   ######
     ######       ########  #####       ######
  ######           ########  ##            ######
######               ########                ######
######                ########               ######
  ######            ##  ########           ######
     ######       #####  ########       ######
       ######   ########   ########   ######`;
server.listen(PORT, () => {
    console.log(ASCIIART, 'color: #bada55');
    console.log(`Server running at port: ${PORT} | pid: ${process.pid} \n`);
});
