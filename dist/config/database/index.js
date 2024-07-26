"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTransaction = exports.executeQuery = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cert = `
-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUfjj2w0jSUVf1vcnLv3z0Av5xOZEwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNjIyNjhiODItNjFiZS00MTJjLThiNmUtNWRmMGRlNTE2
NDdiIFByb2plY3QgQ0EwHhcNMjQwNDExMTE0OTIzWhcNMzQwNDA5MTE0OTIzWjA6
MTgwNgYDVQQDDC82MjI2OGI4Mi02MWJlLTQxMmMtOGI2ZS01ZGYwZGU1MTY0N2Ig
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBANWnb3lV
JZV1reJ8oq4fzlGAlkInw14YsRWF5qn8s83b1qVamphzpmxjhcVAudAYen99WYc5
S++dvtGRzWYKqxq/2Kp4IddHVaRHaLDk9i+1uKx8jWu0ImRQ04ozWkj5Z7+YrN3+
Xup46UXGmZf/hE/AQXIMSYLMv+W8hdfTgDZriI+4yra1PwL90oIXNkbuXtfWqcl9
AqEIeTHPRwyg/JUKdruHtA1cgFR/t1+fIosSIkoy91SzYmZLYCgXmx3Dw8DZj9UY
bNffIH3XOa6eJXDBnl3xir4Pq+Ifcv0h64/DMQHcAKJU342ANi17XG+MLnBpvd+E
EAJPx02dtSDSrWb/sjbtvsKxLDx7NKMTVyFgGfYjxJwzt79FKeZeX41ejLA/CuH1
cb1k3W1kXXWRpyC4SQAvxtmMK/TfIiMZDtf9kn85jUJcMf9hv+qfP7FnEIffLq/r
ifLDlGepNoui3dnqM51cAffl2/N1sVVzX0LLiN0DuSutHRFqOWX4D4hdXwIDAQAB
oz8wPTAdBgNVHQ4EFgQUddhDxLk3Te49a3/6gsKIpmzmdQkwDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAGaKG4v6Hz7qY9MD
+fmMvuxI8dBAe54vOwv+6N0gNPKsYvIeuLUXlqLJi4t28oHwZl26aGVKjhFk75B1
X+1O+1g3lK/aJzweCwHc5zKa8FBRaytvRUaBkV9mwECfX8g8rPt+OJ3No++6xK49
AdbHKBUkNW5+kS5ua5KcLhi6Zcr3Pq25tLlz7S2JccyjAW1yh0Zbp6W0dy7DIiJe
jMvEAboqTYzSXFrJObdZs9+oQs8sOGPZkdzr0Vip8WhoTiHP8Zi7uCvoh/CBqa5P
3zNzKXffEGXxmRW0YZmdRzGyjEa+u4tRX1NoswKIwoD3XPemsuEAbND2BkGKmOPn
ud6RdybaTsj9llNmm1OVfc69UzPRcE6Eobbw+obA2tOY/KQSBkuwfNZkD7+GtFP7
OTy3cA1uy01x3cEOskNpPZ+6poBgs7AyAc1VPyJbupFvce/qPqu5ut/4x1hKb9Ex
klAEltAivfVZWP+VY8AOm/x6GUSqmZFhFE+vDC4cEkwf+p1gAw==
-----END CERTIFICATE-----
`;
const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT, MYSQL_SSL_REJECT_UNAUTHORIZED, } = process.env;
const dbConfig = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,
    port: Number(MYSQL_PORT),
    connectionLimit: 10,
    ...(MYSQL_SSL_REJECT_UNAUTHORIZED === 'true' && {
        ssl: {
            ca: cert /* fs.readFileSync(__dirname + '/certs/ca-cert.txt') */,
        },
    })
};
const dbPool = promise_1.default.createPool(dbConfig);
process.on('beforeExit', () => {
    dbPool.end();
});
async function executeQuery(query, values) {
    let connection = null;
    try {
        connection = await dbPool.getConnection();
        const [results] = await connection.query(query, values);
        return results;
    }
    catch (error) {
        if (error) {
            throw new Error(`Erro na consulta: ${error}`);
        }
        throw error;
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}
exports.executeQuery = executeQuery;
async function executeTransaction(queries) {
    let connection = null;
    try {
        connection = await dbPool.getConnection();
        await connection.beginTransaction();
        for (const { query, values } of queries) {
            await connection.query(query, values);
        }
        await connection.commit();
    }
    catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw new Error(`Erro durante a transação: ${error}`);
    }
    finally {
        if (connection) {
            connection.release();
        }
    }
}
exports.executeTransaction = executeTransaction;
