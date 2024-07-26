"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "16.4.5",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        "lint-readme": "standard-markdown",
        pretest: "npm run lint && npm run dts-check",
        test: "tap tests/*.js --100 -Rspec",
        "test:coverage": "tap --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@definitelytyped/dtslint": "^0.0.133",
        "@types/node": "^18.11.3",
        decache: "^4.6.1",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-markdown": "^7.1.0",
        "standard-version": "^9.5.0",
        tap: "^16.3.0",
        tar: "^6.1.11",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    "use strict";
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      const vaultPath = _vaultPath(options);
      const result = DotenvModule.configDotenv({ path: vaultPath });
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _log(message) {
      console.log(`[dotenv@${version}][INFO] ${message}`);
    }
    function _warn(message) {
      console.log(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      _log("Loading env from encrypted .env.vault");
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// src/server.ts
var import_cors = __toESM(require("cors"));
var import_dotenv7 = __toESM(require_main());
var import_express79 = __toESM(require("express"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_http = __toESM(require("http"));

// src/routes/tec/index.ts
var import_express13 = __toESM(require("express"));

// src/routes/tec/historic/index.ts
var import_express2 = __toESM(require("express"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));

// src/functions/index.ts
var import_node_crypto = require("crypto");
var import_dotenv2 = __toESM(require_main());

// src/config/redis.ts
var import_ioredis = __toESM(require("ioredis"));
var import_util = require("util");
var import_dotenv = __toESM(require_main());
import_dotenv.default.config();
var {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USER,
  REDIS_PASSWORD,
  REDIS_TLS_REJECT_UNAUTHORIZED
} = process.env;
var redisClient = new import_ioredis.default({
  username: REDIS_USER,
  host: REDIS_HOST,
  password: REDIS_PASSWORD,
  port: Number(REDIS_PORT),
  retryStrategy: (times) => Math.min(times * 50, 2e3),
  ...REDIS_TLS_REJECT_UNAUTHORIZED === "true" && {
    tls: { servername: REDIS_HOST }
  }
});
redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});
redisClient.on("connect", () => {
  console.log("Conectado ao Redis");
});
redisClient.on("reconnecting", (delay) => {
  console.log(`Tentando reconectar ao Redis em ${delay}ms`);
});
function getRedis(value) {
  const sysncRedisGet = (0, import_util.promisify)(redisClient.get).bind(redisClient);
  return sysncRedisGet(value);
}
function setRedis(key, value) {
  const sysncRedisSet = (0, import_util.promisify)(redisClient.set).bind(redisClient);
  return sysncRedisSet(key, value);
}

// src/functions/index.ts
import_dotenv2.default.config();
async function getAuthenticationHash() {
  const salt = process.env.SECRET_SALT;
  const ssid = await getRedis("_session_ssid") ?? "00000";
  return (0, import_node_crypto.createHash)("sha256").update(ssid + salt).digest("hex");
}

// src/config/database/index.ts
var import_promise = __toESM(require("mysql2/promise"));
var import_dotenv3 = __toESM(require_main());
import_dotenv3.default.config();
var cert = `
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
var {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_PORT,
  MYSQL_SSL_REJECT_UNAUTHORIZED
} = process.env;
var dbConfig = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: Number(MYSQL_PORT),
  connectionLimit: 10,
  ...MYSQL_SSL_REJECT_UNAUTHORIZED === "true" && {
    ssl: {
      ca: cert
    }
  }
};
var dbPool = import_promise.default.createPool(dbConfig);
process.on("beforeExit", () => {
  dbPool.end();
});
async function executeQuery(query, values) {
  let connection = null;
  try {
    connection = await dbPool.getConnection();
    const [results] = await connection.query(query, values);
    return results;
  } catch (error) {
    if (error) {
      throw new Error(`Erro na consulta: ${error}`);
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
async function executeTransaction(queries) {
  let connection = null;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();
    for (const { query, values } of queries) {
      await connection.query(query, values);
    }
    await connection.commit();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw new Error(`Erro durante a transa\xE7\xE3o: ${error}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// src/routes/tec/historic/details/index.ts
var import_express = __toESM(require("express"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_zod = require("zod");
var router = import_express.default.Router();
var paramsSchema = import_zod.z.object({
  token: import_zod.z.string(),
  employeeId: import_zod.z.string().min(1),
  protocol: import_zod.z.string().max(17),
  updateCount: import_zod.z.string().min(1).transform((item) => Number(item))
});
var executionStatus = /* @__PURE__ */ new Map();
router.post("/historic/details", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus.has(ip) && executionStatus.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus.set(ip, true);
    const { token, employeeId, protocol, updateCount } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql1 = "SELECT * FROM tbl_operations_logs WHERE employee_id = ? AND protocol = ? AND update_count = ?";
          const sql2 = "SELECT * FROM tbl_service_catalog";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, updateCount]);
          const serviceList = await executeQuery(sql2);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus.set(ip, false);
  }
});
var details_default = router;

// src/routes/tec/historic/index.ts
var import_zod2 = require("zod");
var router2 = import_express2.default.Router();
var executionStatus2 = /* @__PURE__ */ new Map();
var paramsSchema2 = import_zod2.z.object({
  initial_id: import_zod2.z.number().nullable().optional(),
  token: import_zod2.z.string()
});
router2.post("/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus2.has(ip) && executionStatus2.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus2.set(ip, true);
    const { initial_id, token } = paramsSchema2.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken2.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectEmployee = async (initial_id2, employee_id) => {
            const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            if (!initial_id2) return await executeQuery(sqlFirst, [employee_id]);
            return await executeQuery(sqlLast, [initial_id2, employee_id]);
          };
          const { user: admin } = decoded;
          const resultEmployee = await selectEmployee(initial_id, admin.id);
          res.json(resultEmployee);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken2.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken2.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod2.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus2.set(ip, false);
  }
});
router2.use(details_default);
var historic_default = router2;

// src/routes/tec/new/index.ts
var import_express3 = __toESM(require("express"));
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"));

// src/utils/CreateProtocol.ts
var import_crypto = __toESM(require("crypto"));
function createProtocol(length) {
  const randomBuffer = import_crypto.default.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomBuffer[i] % 10;
  }
  return code;
}

// src/routes/tec/new/index.ts
var import_zod3 = require("zod");

// src/config/websocket.ts
var import_socket = require("socket.io-client");
var import_dotenv4 = __toESM(require_main());
import_dotenv4.default.config();
function websocket(token) {
  const cookies = /* @__PURE__ */ new Map();
  cookies.set("auth_token", token);
  const socket = (0, import_socket.io)(String(process.env.WEBSOCKET_SERVER_BASEURL), {
    transports: ["websocket"],
    withCredentials: true,
    reconnection: true,
    // Ativar reconexão automática
    reconnectionAttempts: 5,
    // Número máximo de tentativas de reconexão
    reconnectionDelay: 1e3,
    // Atraso inicial de reconexão em milissegundos
    reconnectionDelayMax: 5e3,
    // Atraso máximo de reconexão em milissegundos
    extraHeaders: {
      "Origin": String(process.env.BACKEND_ORIGIN_BASEURL),
      "Cookie": Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join("; ")
    }
  });
  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
      resolve(socket);
    });
    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      reject(error);
    });
  });
}

// src/routes/tec/new/index.ts
function getCurrentDateTime(date) {
  const now = date ? new Date(date) : /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var router3 = import_express3.default.Router();
var paramsSchema3 = import_zod3.z.object({
  clientName: import_zod3.z.string().min(1).regex(/^[^0-9]*$/),
  city: import_zod3.z.string().min(1).regex(/^[^0-9]*$/),
  classification: import_zod3.z.string().min(1).max(2),
  nomenclature: import_zod3.z.string().min(1),
  address: import_zod3.z.string().min(1),
  startServiceAt: import_zod3.z.string().refine((dateString) => {
    const currentDate = /* @__PURE__ */ new Date();
    const inputDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= currentDate;
  }, {
    message: "A data de in\xEDcio do servi\xE7o n\xE3o pode ser anterior \xE0 data atual"
  }),
  token: import_zod3.z.string()
});
var executionStatus3 = /* @__PURE__ */ new Map();
router3.post("/new", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus3.has(ip) && executionStatus3.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus3.set(ip, true);
    const {
      clientName,
      city,
      classification,
      nomenclature,
      address,
      startServiceAt,
      token
    } = paramsSchema3.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken3.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime();
          const getStartServiceAt = getCurrentDateTime(startServiceAt);
          const protocol = createProtocol(17);
          const status = "active";
          const updateCount = 0;
          const { user: employee } = decoded;
          const values = [
            protocol,
            employee.id,
            null,
            clientName,
            city,
            classification,
            nomenclature,
            address,
            status,
            updateCount,
            getStartServiceAt,
            null,
            null,
            null,
            createdAt,
            null,
            null
          ];
          const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          const queryOperationsHistory = `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count,
          start_service_at, 
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          await executeTransaction([
            { query: queryOperations, values },
            { query: queryOperationsHistory, values }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: String(employee.id) }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken3.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken3.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod3.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus3.set(ip, false);
  }
});
var new_default = router3;

// src/routes/tec/running/index.ts
var import_express11 = __toESM(require("express"));
var import_jsonwebtoken10 = __toESM(require("jsonwebtoken"));

// src/routes/tec/running/cancel/index.ts
var import_express4 = __toESM(require("express"));
var import_jsonwebtoken4 = __toESM(require("jsonwebtoken"));

// src/models/operation_logs/insert_state_modification.ts
function getCurrentDateTime2() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function insert_state_modification(props) {
  const createdAt = getCurrentDateTime2();
  const {
    row,
    newStatus,
    listMaterial,
    listService,
    observation
  } = props;
  const values = [
    row.protocol,
    row.employee_id,
    row.creator_leader_id,
    row.client_name,
    row.city,
    row.classification,
    row.nomenclature,
    row.address,
    newStatus,
    row.update_count + 1,
    row.start_service_at,
    row.created_at,
    newStatus === "concluded" ? row.modification_at : createdAt,
    listService ?? null,
    listMaterial ?? null,
    observation ?? null,
    newStatus === "concluded" ? createdAt : null
  ];
  const queryOperations = `
  INSERT INTO tbl_operations_logs (
    protocol, 
    employee_id, 
    creator_leader_id,
    client_name, 
    city, 
    classification, 
    nomenclature, 
    address, 
    status, 
    update_count,
    start_service_at, 
    created_at, 
    modification_at, 
    list_service, 
    list_material,
    observation,  
    finished_at
) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  return { query: queryOperations, values };
}

// src/routes/tec/running/cancel/index.ts
var import_zod4 = require("zod");
var router4 = import_express4.default.Router();
var paramsSchema4 = import_zod4.z.object({
  token: import_zod4.z.string(),
  protocol: import_zod4.z.string().max(17)
});
var executionStatus4 = /* @__PURE__ */ new Map();
router4.post("/running/cancel", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus4.has(ip) && executionStatus4.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus4.set(ip, true);
    const { token, protocol } = paramsSchema4.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken4.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [user.id, protocol]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const valueDeleteOperations = [row.employee_id, row.protocol];
          const queryDeleteOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const newStatus = "canceled";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { query: queryDeleteOperations, values: valueDeleteOperations },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken4.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken4.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod4.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus4.set(ip, false);
  }
});
var cancel_default = router4;

// src/routes/tec/running/pause/index.ts
var import_express5 = __toESM(require("express"));
var import_jsonwebtoken5 = __toESM(require("jsonwebtoken"));
var import_zod5 = require("zod");
var import_dotenv5 = __toESM(require_main());

// src/models/operations/update_state_modification.ts
function getCurrentDateTime3() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function update_state_modification(props) {
  const createdAt = getCurrentDateTime3();
  const {
    row,
    newStatus,
    listService,
    listMaterial,
    observation
  } = props;
  const values = [
    row.protocol,
    row.employee_id,
    row.creator_leader_id,
    row.client_name,
    row.city,
    row.classification,
    row.nomenclature,
    row.address,
    newStatus,
    row.update_count,
    row.start_service_at,
    row.created_at,
    createdAt,
    listService ?? null,
    listMaterial ?? null,
    observation ?? null
  ];
  const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id,
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          created_at, 
          modification_at, 
          list_service, 
          list_material,
          observation,  
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL) 
      ON DUPLICATE KEY UPDATE 
          employee_id = VALUES(employee_id),
          creator_leader_id = VALUES(creator_leader_id),
          client_name = VALUES(client_name),
          city = VALUES(city),
          classification = VALUES(classification),
          nomenclature = VALUES(nomenclature),
          address = VALUES(address),
          status = VALUES(status),
          update_count = update_count + 1,
          start_service_at = VALUES(start_service_at),
          modification_at = VALUES(modification_at),
          list_service = VALUES(list_service),
          list_material = VALUES(list_material),
          observation = VALUES(observation),
          finished_at = VALUES(finished_at);`;
  return { query: queryOperations, values };
}

// src/routes/tec/running/pause/index.ts
import_dotenv5.default.config();
var router5 = import_express5.default.Router();
var paramsSchema5 = import_zod5.z.object({
  token: import_zod5.z.string(),
  protocol: import_zod5.z.string().max(17)
});
var executionStatus5 = /* @__PURE__ */ new Map();
router5.post("/running/pause", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus5.has(ip) && executionStatus5.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus5.set(ip, true);
    const { token, protocol } = paramsSchema5.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken5.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [row] = await executeQuery(selectSql, [user.id, protocol, "active"]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const newStatus = "paused";
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { ...updateStateModificationService },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken5.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken5.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod5.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus5.set(ip, false);
  }
});
var pause_default = router5;

// src/routes/tec/running/start/index.ts
var import_express6 = __toESM(require("express"));
var import_jsonwebtoken6 = __toESM(require("jsonwebtoken"));
var import_zod6 = require("zod");
var import_dotenv6 = __toESM(require_main());
import_dotenv6.default.config();
var router6 = import_express6.default.Router();
var paramsSchema6 = import_zod6.z.object({
  token: import_zod6.z.string(),
  protocol: import_zod6.z.string().max(17)
});
var executionStatus6 = /* @__PURE__ */ new Map();
router6.post("/running/start", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus6.has(ip) && executionStatus6.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus6.set(ip, true);
    const { token, protocol } = paramsSchema6.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken6.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [row] = await executeQuery(selectSql, [user.id, protocol, "paused"]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const newStatus = "active";
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { ...updateStateModificationService },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken6.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken6.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod6.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus6.set(ip, false);
  }
});
var start_default = router6;

// src/routes/tec/running/finish/index.ts
var import_express10 = __toESM(require("express"));

// src/routes/tec/running/finish/concluded/index.ts
var import_express7 = __toESM(require("express"));
var import_jsonwebtoken7 = __toESM(require("jsonwebtoken"));
var import_zod7 = require("zod");

// src/models/stock_employee/increment_item.ts
async function increment_item(materials) {
  function generateQueryListMaterial(arr) {
    const placeholders = arr.map(() => "?").join(", ");
    return `SELECT * FROM tbl_stock_employee WHERE id IN (${placeholders})`;
  }
  function generatePlaceholders3(data) {
    const placeholders = data.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    return placeholders;
  }
  const requestListMaterial = JSON.parse(materials);
  if (!requestListMaterial) {
    throw new Error("Lista de materiais n\xE3o foi fornecida");
  }
  const listMaterialKeys = Object.keys(requestListMaterial);
  const queryListMaterial = generateQueryListMaterial(listMaterialKeys);
  const selectQueryListMaterial = await executeQuery(queryListMaterial, listMaterialKeys);
  const resultQueryListMaterial = selectQueryListMaterial.map((items) => ({
    ...items,
    quantity_value: items.quantity_value - requestListMaterial[items.id]
  }));
  const updateValueMaterialsEmployee = [];
  resultQueryListMaterial.forEach((item) => {
    updateValueMaterialsEmployee.push(
      item.id,
      item.employee_id,
      item.product_name,
      item.product_code,
      item.product_batch,
      requestListMaterial[item.id],
      item.unit_type,
      item.created_at
    );
  });
  const queryMaterialsEmployee = `
  INSERT INTO tbl_stock_employee 
      (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
    VALUES ${generatePlaceholders3(resultQueryListMaterial)}
    ON DUPLICATE KEY UPDATE 
      id = VALUES(id),
      employee_id = VALUES(employee_id),
      product_name = VALUES(product_name), 
      product_code = VALUES(product_code),
      product_batch = VALUES(product_batch),
      quantity_value = quantity_value + VALUES(quantity_value),
      unit_type = VALUES(unit_type),
      created_at = VALUES(created_at);
    `;
  return { query: queryMaterialsEmployee, values: updateValueMaterialsEmployee };
}

// src/models/stock_employee/decrement_item.ts
async function decrement_item(materials) {
  function generateQueryListMaterial(arr) {
    const placeholders = arr.map(() => "?").join(", ");
    return `SELECT * FROM tbl_stock_employee WHERE id IN (${placeholders})`;
  }
  function generatePlaceholders3(data) {
    const placeholders = data.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    return placeholders;
  }
  const requestListMaterial = JSON.parse(materials);
  if (!requestListMaterial) {
    throw new Error("Lista de materiais n\xE3o foi fornecida");
  }
  const listMaterialKeys = Object.keys(requestListMaterial);
  const queryListMaterial = generateQueryListMaterial(listMaterialKeys);
  const selectQueryListMaterial = await executeQuery(queryListMaterial, listMaterialKeys);
  const resultQueryListMaterial = selectQueryListMaterial.map((items) => ({
    ...items,
    quantity_value: items.quantity_value - requestListMaterial[items.id]
  }));
  const updateValueMaterialsEmployee = [];
  resultQueryListMaterial.forEach((item) => {
    updateValueMaterialsEmployee.push(
      item.id,
      item.employee_id,
      item.product_name,
      item.product_code,
      item.product_batch,
      requestListMaterial[item.id],
      item.unit_type,
      item.created_at
    );
  });
  const queryMaterialsEmployee = `
  INSERT INTO tbl_stock_employee 
      (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
    VALUES ${generatePlaceholders3(resultQueryListMaterial)}
    ON DUPLICATE KEY UPDATE 
      id = VALUES(id),
      employee_id = VALUES(employee_id),
      product_name = VALUES(product_name), 
      product_code = VALUES(product_code),
      product_batch = VALUES(product_batch),
      quantity_value = quantity_value - VALUES(quantity_value),
      unit_type = VALUES(unit_type),
      created_at = VALUES(created_at);
    `;
  return { query: queryMaterialsEmployee, values: updateValueMaterialsEmployee };
}

// src/routes/tec/running/finish/concluded/index.ts
var router7 = import_express7.default.Router();
var paramsSchema7 = import_zod7.z.object({
  token: import_zod7.z.string(),
  protocol: import_zod7.z.string().max(17),
  observation: import_zod7.z.string().max(500).optional(),
  listService: import_zod7.z.string(),
  listMaterial: import_zod7.z.string().optional()
});
var executionStatus7 = /* @__PURE__ */ new Map();
router7.post("/running/finish/concluded", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus7.has(ip) && executionStatus7.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus7.set(ip, true);
    const {
      token,
      protocol,
      observation,
      listMaterial,
      listService
    } = paramsSchema7.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken7.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [row] = await executeQuery(selectSql, [user.id, protocol, "active"]);
          if (!row) {
            console.error("Invalid request");
            return res.status(400).json({ error: "Invalid request" });
          }
          const modification = {
            row,
            newStatus: "analysis",
            listMaterial,
            listService,
            observation
          };
          const executeTransactionArray = [];
          const updateStateModificationService = await update_state_modification(modification);
          executeTransactionArray.push(updateStateModificationService);
          const createStateModificationHistoryRecord = await insert_state_modification(modification);
          executeTransactionArray.push(createStateModificationHistoryRecord);
          if (listMaterial) {
            const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
            executeTransactionArray.push(decrementStockItemQuantityEmployee);
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken7.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken7.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod7.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus7.set(ip, false);
  }
});
var concluded_default = router7;

// src/routes/tec/running/finish/select-material/index.ts
var import_express8 = __toESM(require("express"));
var import_jsonwebtoken8 = __toESM(require("jsonwebtoken"));
var import_zod8 = require("zod");
var router8 = import_express8.default.Router();
var paramsSchema8 = import_zod8.z.object({
  token: import_zod8.z.string(),
  protocol: import_zod8.z.string().max(17)
});
var executionStatus8 = /* @__PURE__ */ new Map();
router8.post("/running/finish/select-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus8.has(ip) && executionStatus8.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus8.set(ip, true);
    const { token, protocol } = paramsSchema8.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken8.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ? ORDER BY created_at DESC";
          const newStatus = "active";
          const rows = await executeQuery(selectSql, [user.id, protocol, newStatus]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken8.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken8.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod8.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus8.set(ip, false);
  }
});
var select_material_default = router8;

// src/routes/tec/running/finish/select-service/index.ts
var import_express9 = __toESM(require("express"));
var import_jsonwebtoken9 = __toESM(require("jsonwebtoken"));
var import_zod9 = require("zod");
var router9 = import_express9.default.Router();
var paramsSchema9 = import_zod9.z.object({
  token: import_zod9.z.string(),
  protocol: import_zod9.z.string().max(17)
});
var executionStatus9 = /* @__PURE__ */ new Map();
router9.post("/running/finish/select-service", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus9.has(ip) && executionStatus9.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus9.set(ip, true);
    const { token, protocol } = paramsSchema9.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken9.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const sql1 = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ? ORDER BY created_at DESC";
          const sql2 = "SELECT * FROM tbl_service_catalog WHERE status = ?";
          const newStatus = "active";
          const currentOperation = await executeQuery(sql1, [user.id, protocol, newStatus]);
          const serviceList = await executeQuery(sql2, ["ativo"]);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken9.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken9.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod9.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus9.set(ip, false);
  }
});
var select_service_default = router9;

// src/routes/tec/running/finish/index.ts
var router10 = import_express10.default.Router();
router10.use(concluded_default);
router10.use(select_material_default);
router10.use(select_service_default);
var finish_default = router10;

// src/routes/tec/running/index.ts
var import_zod10 = require("zod");
var router11 = import_express11.default.Router();
var executionStatus10 = /* @__PURE__ */ new Map();
router11.post("/running", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus10.has(ip) && executionStatus10.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus10.set(ip, true);
    const paramsSchema61 = import_zod10.z.object({ token: import_zod10.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken10.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const sql = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE u1.employee_id = ?
      ORDER BY u1.created_at DESC`;
          const rows = await executeQuery(sql, [user.id]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken10.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken10.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod10.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus10.set(ip, false);
  }
});
router11.use(finish_default);
router11.use(cancel_default);
router11.use(pause_default);
router11.use(start_default);
var running_default = router11;

// src/routes/tec/stock/index.ts
var import_express12 = __toESM(require("express"));
var import_jsonwebtoken11 = __toESM(require("jsonwebtoken"));
var import_zod11 = require("zod");
var router12 = import_express12.default.Router();
var paramsSchema10 = import_zod11.z.object({
  employee_id: import_zod11.z.number().min(1),
  token: import_zod11.z.string()
});
var executionStatus11 = /* @__PURE__ */ new Map();
router12.post("/stock", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus11.has(ip) && executionStatus11.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus11.set(ip, true);
    const { employee_id, token } = paramsSchema10.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken11.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT * FROM tbl_stock_employee WHERE employee_id = ? ORDER BY created_at DESC";
          const rows = await executeQuery(sql, [employee_id]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken11.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken11.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod11.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus11.set(ip, false);
  }
});
var stock_default = router12;

// src/routes/tec/index.ts
var router13 = import_express13.default.Router();
router13.use(historic_default);
router13.use(new_default);
router13.use(running_default);
router13.use(stock_default);
var tec_default = router13;

// src/routes/admin/index.ts
var import_express29 = __toESM(require("express"));

// src/routes/admin/manage/index.ts
var import_express19 = __toESM(require("express"));
var import_jsonwebtoken17 = __toESM(require("jsonwebtoken"));

// src/routes/admin/manage/new/index.ts
var import_express14 = __toESM(require("express"));
var import_jsonwebtoken12 = __toESM(require("jsonwebtoken"));
var import_zod12 = require("zod");
function getCurrentDateTime4(date) {
  const now = date ? new Date(date) : /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var router14 = import_express14.default.Router();
var paramsSchema11 = import_zod12.z.object({
  employeeId: import_zod12.z.number().min(1),
  clientName: import_zod12.z.string().min(1).regex(/^[^0-9]*$/),
  city: import_zod12.z.string().min(1).regex(/^[^0-9]*$/),
  classification: import_zod12.z.string().min(1).max(2),
  nomenclature: import_zod12.z.string().min(1),
  address: import_zod12.z.string().min(1),
  startServiceAt: import_zod12.z.string().refine((dateString) => {
    const currentDate = /* @__PURE__ */ new Date();
    const inputDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= currentDate;
  }, {
    message: "A data de in\xEDcio do servi\xE7o n\xE3o pode ser anterior \xE0 data atual"
  }),
  token: import_zod12.z.string()
});
var executionStatus12 = /* @__PURE__ */ new Map();
router14.post("/manage/new", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus12.has(ip) && executionStatus12.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus12.set(ip, true);
    const {
      employeeId,
      clientName,
      city,
      classification,
      nomenclature,
      address,
      startServiceAt,
      token
    } = paramsSchema11.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken12.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime4();
          const getStartServiceAt = getCurrentDateTime4(startServiceAt);
          const protocol = createProtocol(17);
          const status = "active";
          const updateCount = 0;
          const { user: admin } = decoded;
          const values = [
            protocol,
            employeeId,
            admin.id,
            clientName,
            city,
            classification,
            nomenclature,
            address,
            status,
            updateCount,
            getStartServiceAt,
            null,
            null,
            null,
            createdAt,
            null,
            null
          ];
          const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          const queryOperationsHistory = `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          await executeTransaction([
            { query: queryOperations, values },
            { query: queryOperationsHistory, values }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: employeeId }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken12.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken12.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod12.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus12.set(ip, false);
  }
});
var new_default2 = router14;

// src/routes/admin/manage/historic/index.ts
var import_express16 = __toESM(require("express"));
var import_jsonwebtoken14 = __toESM(require("jsonwebtoken"));

// src/routes/admin/manage/historic/details/index.ts
var import_express15 = __toESM(require("express"));
var import_jsonwebtoken13 = __toESM(require("jsonwebtoken"));
var import_zod13 = require("zod");
var router15 = import_express15.default.Router();
var paramsSchema12 = import_zod13.z.object({
  token: import_zod13.z.string(),
  employeeId: import_zod13.z.string().min(1),
  protocol: import_zod13.z.string().max(17),
  updateCount: import_zod13.z.string().min(1).transform((item) => Number(item))
});
var executionStatus13 = /* @__PURE__ */ new Map();
router15.post("/manage/historic/details", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus13.has(ip) && executionStatus13.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus13.set(ip, true);
    const { token, employeeId, protocol, updateCount } = paramsSchema12.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken13.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql1 = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader, creator_leader_user.role AS role_creator_leader
      FROM tbl_operations_logs u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE employee_id = ? AND protocol = ? AND update_count = ?
      ORDER BY u1.created_at DESC;
      `;
          const sql2 = "SELECT * FROM tbl_service_catalog";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, updateCount]);
          const serviceList = await executeQuery(sql2);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken13.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken13.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod13.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus13.set(ip, false);
  }
});
var details_default2 = router15;

// src/routes/admin/manage/historic/index.ts
var import_zod14 = require("zod");
var router16 = import_express16.default.Router();
var executionStatus14 = /* @__PURE__ */ new Map();
var paramsSchema13 = import_zod14.z.object({
  employee_all: import_zod14.z.boolean().optional(),
  employee_id: import_zod14.z.number().optional(),
  initial_id: import_zod14.z.number().nullable().optional(),
  token: import_zod14.z.string()
});
router16.post("/manage/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus14.has(ip) && executionStatus14.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus14.set(ip, true);
    const { employee_all, employee_id, initial_id, token } = paramsSchema13.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken14.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectEmployee = async (initial_id2, employee_id2) => {
            const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            if (!initial_id2) return await executeQuery(sqlFirst, [employee_id2]);
            return await executeQuery(sqlLast, [initial_id2, employee_id2]);
          };
          const selectEmployeeAll = async (initial_id2) => {
            const sqlFirst = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
        ORDER BY id DESC
        LIMIT 10;
        `;
            const sqlLast = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < ?
        ORDER BY id DESC
        LIMIT 10;
        `;
            if (!initial_id2) return await executeQuery(sqlFirst);
            return await executeQuery(sqlLast, [initial_id2]);
          };
          const resultEmployeeAll = await selectEmployeeAll(initial_id);
          const resultEmployee = await selectEmployee(initial_id, employee_id);
          res.json(employee_all ? resultEmployeeAll : resultEmployee);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken14.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken14.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod14.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus14.set(ip, false);
  }
});
router16.use(details_default2);
var historic_default2 = router16;

// src/routes/admin/manage/update_password_employee/index.ts
var import_express17 = __toESM(require("express"));
var import_jsonwebtoken15 = __toESM(require("jsonwebtoken"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_zod15 = require("zod");
var router17 = import_express17.default.Router();
var paramsSchema14 = import_zod15.z.object({
  employeeId: import_zod15.z.string().min(1),
  yourPassword: import_zod15.z.string().min(1).trim(),
  newPasswordEmployee: import_zod15.z.string().min(1).trim(),
  token: import_zod15.z.string()
});
var executionStatus15 = /* @__PURE__ */ new Map();
router17.post("/manage/update_password_employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus15.has(ip) && executionStatus15.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus15.set(ip, true);
    const {
      employeeId,
      yourPassword,
      newPasswordEmployee,
      token
    } = paramsSchema14.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken15.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user: admin } = decoded;
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE id = ?";
          const rowsAdmin = await executeQuery(sqlSelect, [admin.id]);
          if (!(rowsAdmin.length === 1 && import_bcryptjs.default.compareSync(yourPassword, rowsAdmin[0]?.password))) {
            return res.status(401).send("Invalid credentials");
          }
          const hashEmployee = import_bcryptjs.default.hashSync(newPasswordEmployee, 10);
          const values = [hashEmployee, employeeId];
          const sqlUpdate = "UPDATE tbl_user_accounts SET password = ? WHERE id = ?";
          await executeQuery(sqlUpdate, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken15.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken15.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod15.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus15.set(ip, false);
  }
});
var update_password_employee_default = router17;

// src/routes/admin/manage/update_status_employee/index.ts
var import_express18 = __toESM(require("express"));
var import_jsonwebtoken16 = __toESM(require("jsonwebtoken"));
var import_bcryptjs2 = __toESM(require("bcryptjs"));
var import_zod16 = require("zod");
var router18 = import_express18.default.Router();
var paramsSchema15 = import_zod16.z.object({
  employeeId: import_zod16.z.string().min(1),
  yourPassword: import_zod16.z.string().min(1).trim(),
  accountStatus: import_zod16.z.enum(["inactive", "active"]),
  token: import_zod16.z.string()
});
var executionStatus16 = /* @__PURE__ */ new Map();
router18.post("/manage/update_status_employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus16.has(ip) && executionStatus16.get(ip) === true) {
    console.error("J\xE1 existe n uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus16.set(ip, true);
    const {
      employeeId,
      yourPassword,
      accountStatus,
      token
    } = paramsSchema15.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken16.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user: admin } = decoded;
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE id = ?";
          const [user] = await executeQuery(sqlSelect, [admin.id]);
          if (!user) {
            return res.status(401).send("Credenciais inv\xE1lidas");
          }
          const isPasswordValid = import_bcryptjs2.default.compareSync(yourPassword, user.password);
          if (!isPasswordValid) {
            return res.status(401).send("Credenciais inv\xE1lidas");
          }
          const values = [accountStatus, employeeId];
          const sqlUpdate = "UPDATE tbl_user_accounts SET status = ? WHERE id = ?";
          await executeQuery(sqlUpdate, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken16.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken16.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod16.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus16.set(ip, false);
  }
});
var update_status_employee_default = router18;

// src/routes/admin/manage/index.ts
var import_zod17 = require("zod");
var router19 = import_express19.default.Router();
var executionStatus17 = /* @__PURE__ */ new Map();
router19.post("/manage", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus17.has(ip) && executionStatus17.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus17.set(ip, true);
    const paramsSchema61 = import_zod17.z.object({ token: import_zod17.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken17.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
          const roles = ["superadmin", "admin", "almox", "cop", "config"];
          const rows = await executeQuery(sql, roles);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken17.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken17.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod17.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus17.set(ip, false);
  }
});
router19.use(new_default2);
router19.use(historic_default2);
router19.use(update_password_employee_default);
router19.use(update_status_employee_default);
var manage_default = router19;

// src/routes/admin/running/index.ts
var import_express27 = __toESM(require("express"));
var import_jsonwebtoken24 = __toESM(require("jsonwebtoken"));

// src/routes/admin/running/finish/index.ts
var import_express23 = __toESM(require("express"));

// src/routes/admin/running/finish/concluded/index.ts
var import_express20 = __toESM(require("express"));
var import_jsonwebtoken18 = __toESM(require("jsonwebtoken"));
var import_zod18 = require("zod");
var router20 = import_express20.default.Router();
var paramsSchema16 = import_zod18.z.object({
  token: import_zod18.z.string(),
  employeeId: import_zod18.z.string().min(1),
  protocol: import_zod18.z.string().max(17),
  observation: import_zod18.z.string().max(500).optional(),
  listService: import_zod18.z.string(),
  listMaterial: import_zod18.z.string().optional()
});
var executionStatus18 = /* @__PURE__ */ new Map();
router20.post("/concluded", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus18.has(ip) && executionStatus18.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus18.set(ip, true);
    const { token, employeeId, protocol, observation, listService, listMaterial } = paramsSchema16.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken18.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(sql, [employeeId, protocol]);
          if (!row) {
            console.error("Requisi\xE7\xE3o inv\xE1lida");
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lida" });
          }
          if (row.status === "concluded") {
            console.error("Servi\xE7o j\xE1 conclu\xEDdo");
            return res.status(409).json({ error: "Servi\xE7o j\xE1 conclu\xEDdo" });
          }
          const executeTransactionArray = [];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const deleteValues = [row.employee_id, row.protocol];
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "concluded";
          const createStateModificationHistoryRecord = await insert_state_modification({
            row,
            newStatus,
            listMaterial,
            listService,
            observation
          });
          executeTransactionArray.push(createStateModificationHistoryRecord);
          if (row.status !== "analysis" && listMaterial) {
            const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
            executeTransactionArray.push(decrementStockItemQuantityEmployee);
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken18.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken18.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod18.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus18.set(ip, false);
  }
});
var concluded_default2 = router20;

// src/routes/admin/running/finish/select-material/index.ts
var import_express21 = __toESM(require("express"));
var import_jsonwebtoken19 = __toESM(require("jsonwebtoken"));
var import_zod19 = require("zod");
var router21 = import_express21.default.Router();
var paramsSchema17 = import_zod19.z.object({
  token: import_zod19.z.string(),
  employeeId: import_zod19.z.string(),
  protocol: import_zod19.z.string().max(17)
});
var executionStatus19 = /* @__PURE__ */ new Map();
router21.post("/running/finish/select-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus19.has(ip) && executionStatus19.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus19.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema17.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken19.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const rows = await executeQuery(sql, [employeeId, protocol, status]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken19.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken19.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod19.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus19.set(ip, false);
  }
});
var select_material_default2 = router21;

// src/routes/admin/running/finish/select-service/index.ts
var import_express22 = __toESM(require("express"));
var import_jsonwebtoken20 = __toESM(require("jsonwebtoken"));
var import_zod20 = require("zod");
var router22 = import_express22.default.Router();
var paramsSchema18 = import_zod20.z.object({
  token: import_zod20.z.string().min(1),
  employeeId: import_zod20.z.string().min(1),
  protocol: import_zod20.z.string().max(17)
});
var executionStatus20 = /* @__PURE__ */ new Map();
router22.post("/running/finish/select-service", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus20.has(ip) && executionStatus20.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus20.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema18.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken20.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql1 = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const sql2 = "SELECT * FROM tbl_service_catalog WHERE status = ?";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, status]);
          const serviceList = await executeQuery(sql2, ["ativo"]);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken20.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken20.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod20.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus20.set(ip, false);
  }
});
var select_service_default2 = router22;

// src/routes/admin/running/finish/index.ts
var router23 = import_express23.default.Router();
router23.use(concluded_default2);
router23.use(select_material_default2);
router23.use(select_service_default2);
var finish_default2 = router23;

// src/routes/admin/running/cancel/index.ts
var import_express24 = __toESM(require("express"));
var import_jsonwebtoken21 = __toESM(require("jsonwebtoken"));
var import_zod21 = require("zod");
var router24 = import_express24.default.Router();
var paramsSchema19 = import_zod21.z.object({
  token: import_zod21.z.string(),
  employeeId: import_zod21.z.string(),
  protocol: import_zod21.z.string().max(17)
});
var executionStatus21 = /* @__PURE__ */ new Map();
router24.post("/running/cancel", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus21.has(ip) && executionStatus21.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus21.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema19.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken21.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          if (row.status === "canceled") {
            return res.status(409).json({ error: "Servi\xE7o j\xE1 pausado" });
          }
          const executeTransactionArray = [];
          const deleteValues = [row.employee_id, row.protocol];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "canceled";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          if (row.status === "analysis" && row.list_material) {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken21.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken21.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod21.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus21.set(ip, false);
  }
});
var cancel_default2 = router24;

// src/routes/admin/running/pause/index.ts
var import_express25 = __toESM(require("express"));
var import_jsonwebtoken22 = __toESM(require("jsonwebtoken"));
var import_zod22 = require("zod");
var paramsSchema20 = import_zod22.z.object({
  token: import_zod22.z.string(),
  employeeId: import_zod22.z.string().min(1),
  protocol: import_zod22.z.string().max(17)
});
var router25 = import_express25.default.Router();
var executionStatus22 = /* @__PURE__ */ new Map();
router25.post("/running/pause", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus22.has(ip) && executionStatus22.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus22.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema20.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken22.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          if (error) {
            executionStatus22.set(ip, false);
          }
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol, "active"]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const newStatus = "paused";
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { ...updateStateModificationService },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken22.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken22.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod22.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus22.set(ip, false);
  }
});
var pause_default2 = router25;

// src/routes/admin/running/start/index.ts
var import_express26 = __toESM(require("express"));
var import_jsonwebtoken23 = __toESM(require("jsonwebtoken"));
var import_zod23 = require("zod");
var router26 = import_express26.default.Router();
var paramsSchema21 = import_zod23.z.object({
  token: import_zod23.z.string(),
  employeeId: import_zod23.z.string().min(1),
  protocol: import_zod23.z.string().max(17)
});
var executionStatus23 = /* @__PURE__ */ new Map();
router26.post("/running/start", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus23.has(ip) && executionStatus23.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus23.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema21.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken23.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          const executeTransactionArray = [];
          const newStatus = "active";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...updateStateModificationService });
          if (row.status === "analysis") {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken23.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken23.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod23.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus23.set(ip, false);
  }
});
var start_default2 = router26;

// src/routes/admin/running/index.ts
var import_zod24 = require("zod");
var router27 = import_express27.default.Router();
var executionStatus24 = /* @__PURE__ */ new Map();
router27.post("/running", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus24.has(ip) && executionStatus24.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus24.set(ip, true);
    const paramsSchema61 = import_zod24.z.object({ token: import_zod24.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken24.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
      SELECT u1.*, 
      tec_user.name AS name_tec, 
      creator_leader_user.name AS name_creator_leader, 
      creator_leader_user.role AS role_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      ORDER BY u1.created_at DESC;
    `;
          const rows = await executeQuery(sql);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken24.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken24.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod24.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus24.set(ip, false);
  }
});
router27.use(finish_default2);
router27.use(cancel_default2);
router27.use(pause_default2);
router27.use(start_default2);
var running_default2 = router27;

// src/routes/admin/register-employee/index.ts
var import_express28 = __toESM(require("express"));
var import_jsonwebtoken25 = __toESM(require("jsonwebtoken"));
var import_bcryptjs3 = __toESM(require("bcryptjs"));
var import_zod25 = require("zod");
var router28 = import_express28.default.Router();
var noNumbers = /^[^0-9]*$/;
var isCnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
var isCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
var paramsSchema22 = import_zod25.z.object({
  name: import_zod25.z.string().min(1).regex(noNumbers),
  identification: import_zod25.z.string().refine((value) => isCnpj.test(value) || isCpf.test(value)),
  password: import_zod25.z.string().min(1).trim(),
  accountType: import_zod25.z.enum(["TEC", "DIR", "ALMOX", "COP"]),
  token: import_zod25.z.string()
});
function getCurrentDateTime5() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus25 = /* @__PURE__ */ new Map();
router28.post("/register-employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus25.has(ip) && executionStatus25.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus25.set(ip, true);
    const {
      name,
      identification,
      password,
      accountType,
      token
    } = paramsSchema22.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken25.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime5();
          const hash = import_bcryptjs3.default.hashSync(password, 10);
          const values = [
            name,
            accountType.toLowerCase(),
            "1234",
            "active",
            identification,
            hash,
            createdAt
          ];
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE identification = ?";
          const rows = await executeQuery(sqlSelect, [identification]);
          if (rows.length > 0) {
            res.json({ status: "already registered" });
            console.log("Funcion\xE1rio(a) n\xE3o registrado!");
            return;
          }
          const sqlInsert = "INSERT INTO tbl_user_accounts ( name, role, team, status, identification, password, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ?)";
          await executeQuery(sqlInsert, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken25.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken25.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod25.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus25.set(ip, false);
  }
});
var register_employee_default = router28;

// src/routes/admin/index.ts
var router29 = import_express29.default.Router();
router29.use(manage_default);
router29.use(running_default2);
router29.use(register_employee_default);
var admin_default = router29;

// src/routes/superadmin/index.ts
var import_express48 = __toESM(require("express"));

// src/routes/superadmin/manage/index.ts
var import_express37 = __toESM(require("express"));
var import_jsonwebtoken33 = __toESM(require("jsonwebtoken"));

// src/routes/superadmin/manage/new/index.ts
var import_express30 = __toESM(require("express"));
var import_jsonwebtoken26 = __toESM(require("jsonwebtoken"));
var import_zod26 = require("zod");
function getCurrentDateTime6(date) {
  const now = date ? new Date(date) : /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var router30 = import_express30.default.Router();
var paramsSchema23 = import_zod26.z.object({
  employeeId: import_zod26.z.number().min(1),
  clientName: import_zod26.z.string().min(1).regex(/^[^0-9]*$/),
  city: import_zod26.z.string().min(1).regex(/^[^0-9]*$/),
  classification: import_zod26.z.string().min(1).max(2),
  nomenclature: import_zod26.z.string().min(1),
  address: import_zod26.z.string().min(1),
  startServiceAt: import_zod26.z.string().refine((dateString) => {
    const currentDate = /* @__PURE__ */ new Date();
    const inputDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= currentDate;
  }, {
    message: "A data de in\xEDcio do servi\xE7o n\xE3o pode ser anterior \xE0 data atual"
  }),
  token: import_zod26.z.string()
});
var executionStatus26 = /* @__PURE__ */ new Map();
router30.post("/manage/new", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus26.has(ip) && executionStatus26.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus26.set(ip, true);
    const {
      employeeId,
      clientName,
      city,
      classification,
      nomenclature,
      address,
      startServiceAt,
      token
    } = paramsSchema23.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken26.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime6();
          const getStartServiceAt = getCurrentDateTime6(startServiceAt);
          const protocol = createProtocol(17);
          const status = "active";
          const updateCount = 0;
          const { user: admin } = decoded;
          const values = [
            protocol,
            employeeId,
            admin.id,
            clientName,
            city,
            classification,
            nomenclature,
            address,
            status,
            updateCount,
            getStartServiceAt,
            null,
            null,
            null,
            createdAt,
            null,
            null
          ];
          const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          const queryOperationsHistory = `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          await executeTransaction([
            { query: queryOperations, values },
            { query: queryOperationsHistory, values }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: employeeId }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken26.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken26.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod26.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus26.set(ip, false);
  }
});
var new_default3 = router30;

// src/routes/superadmin/manage/historic/index.ts
var import_express32 = __toESM(require("express"));
var import_jsonwebtoken28 = __toESM(require("jsonwebtoken"));

// src/routes/superadmin/manage/historic/details/index.ts
var import_express31 = __toESM(require("express"));
var import_jsonwebtoken27 = __toESM(require("jsonwebtoken"));
var import_zod27 = require("zod");
var router31 = import_express31.default.Router();
var paramsSchema24 = import_zod27.z.object({
  token: import_zod27.z.string(),
  employeeId: import_zod27.z.string().min(1),
  protocol: import_zod27.z.string().max(17),
  updateCount: import_zod27.z.string().min(1).transform((item) => Number(item))
});
var executionStatus27 = /* @__PURE__ */ new Map();
router31.post("/manage/historic/details", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus27.has(ip) && executionStatus27.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus27.set(ip, true);
    const { token, employeeId, protocol, updateCount } = paramsSchema24.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken27.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql1 = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader, creator_leader_user.role AS role_creator_leader
      FROM tbl_operations_logs u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE employee_id = ? AND protocol = ? AND update_count = ?
      ORDER BY u1.created_at DESC;
      `;
          const sql2 = "SELECT * FROM tbl_service_catalog";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, updateCount]);
          const serviceList = await executeQuery(sql2);
          res.json({ currentOperation: [...currentOperation], serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken27.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken27.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod27.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus27.set(ip, false);
  }
});
var details_default3 = router31;

// src/routes/superadmin/manage/historic/index.ts
var import_zod28 = require("zod");
var router32 = import_express32.default.Router();
var executionStatus28 = /* @__PURE__ */ new Map();
var paramsSchema25 = import_zod28.z.object({
  employee_all: import_zod28.z.boolean().optional(),
  employee_id: import_zod28.z.number().optional(),
  initial_id: import_zod28.z.number().nullable().optional(),
  token: import_zod28.z.string()
});
router32.post("/manage/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus28.has(ip) && executionStatus28.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus28.set(ip, true);
    const { employee_all, employee_id, initial_id, token } = paramsSchema25.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken28.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectEmployee = async (initial_id2, employee_id2) => {
            const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            if (!initial_id2) return await executeQuery(sqlFirst, [employee_id2]);
            return await executeQuery(sqlLast, [initial_id2, employee_id2]);
          };
          const selectEmployeeAll = async (initial_id2) => {
            const sqlFirst = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
        ORDER BY id DESC
        LIMIT 10;
        `;
            const sqlLast = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < ?
        ORDER BY id DESC
        LIMIT 10;
        `;
            if (!initial_id2) return await executeQuery(sqlFirst);
            return await executeQuery(sqlLast, [initial_id2]);
          };
          const resultEmployeeAll = await selectEmployeeAll(initial_id);
          const resultEmployee = await selectEmployee(initial_id, employee_id);
          res.json(employee_all ? resultEmployeeAll : resultEmployee);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken28.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken28.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod28.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus28.set(ip, false);
  }
});
router32.use(details_default3);
var historic_default3 = router32;

// src/routes/superadmin/manage/update_password_employee/index.ts
var import_express33 = __toESM(require("express"));
var import_jsonwebtoken29 = __toESM(require("jsonwebtoken"));
var import_bcryptjs4 = __toESM(require("bcryptjs"));
var import_zod29 = require("zod");
var router33 = import_express33.default.Router();
var paramsSchema26 = import_zod29.z.object({
  employeeId: import_zod29.z.string().min(1),
  yourPassword: import_zod29.z.string().min(1).trim(),
  newPasswordEmployee: import_zod29.z.string().min(1).trim(),
  token: import_zod29.z.string()
});
var executionStatus29 = /* @__PURE__ */ new Map();
router33.post("/manage/update_password_employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus29.has(ip) && executionStatus29.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus29.set(ip, true);
    const {
      employeeId,
      yourPassword,
      newPasswordEmployee,
      token
    } = paramsSchema26.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken29.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user: admin } = decoded;
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE id = ?";
          const rowsAdmin = await executeQuery(sqlSelect, [admin.id]);
          if (!(rowsAdmin.length === 1 && import_bcryptjs4.default.compareSync(yourPassword, rowsAdmin[0]?.password))) {
            return res.status(401).send("Invalid credentials");
          }
          const hashEmployee = import_bcryptjs4.default.hashSync(newPasswordEmployee, 10);
          const values = [hashEmployee, employeeId];
          const sqlUpdate = "UPDATE tbl_user_accounts SET password = ? WHERE id = ?";
          await executeQuery(sqlUpdate, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken29.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken29.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod29.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus29.set(ip, false);
  }
});
var update_password_employee_default2 = router33;

// src/routes/superadmin/manage/update_status_employee/index.ts
var import_express34 = __toESM(require("express"));
var import_jsonwebtoken30 = __toESM(require("jsonwebtoken"));
var import_bcryptjs5 = __toESM(require("bcryptjs"));
var import_zod30 = require("zod");
var router34 = import_express34.default.Router();
var paramsSchema27 = import_zod30.z.object({
  employeeId: import_zod30.z.string().min(1),
  yourPassword: import_zod30.z.string().min(1).trim(),
  accountStatus: import_zod30.z.enum(["inactive", "active"]),
  token: import_zod30.z.string()
});
var executionStatus30 = /* @__PURE__ */ new Map();
router34.post("/manage/update_status_employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus30.has(ip) && executionStatus30.get(ip) === true) {
    console.error("J\xE1 existe n uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus30.set(ip, true);
    const {
      employeeId,
      yourPassword,
      accountStatus,
      token
    } = paramsSchema27.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken30.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user: admin } = decoded;
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE id = ?";
          const [user] = await executeQuery(sqlSelect, [admin.id]);
          if (!user) {
            return res.status(401).send("Credenciais inv\xE1lidas");
          }
          const isPasswordValid = import_bcryptjs5.default.compareSync(yourPassword, user.password);
          if (!isPasswordValid) {
            return res.status(401).send("Credenciais inv\xE1lidas");
          }
          const values = [accountStatus, employeeId];
          const sqlUpdate = "UPDATE tbl_user_accounts SET status = ? WHERE id = ?";
          await executeQuery(sqlUpdate, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken30.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken30.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod30.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus30.set(ip, false);
  }
});
var update_status_employee_default2 = router34;

// src/routes/superadmin/manage/view_production/index.ts
var import_express35 = __toESM(require("express"));
var import_jsonwebtoken31 = __toESM(require("jsonwebtoken"));
var import_zod31 = require("zod");
var import_moment = __toESM(require("moment"));
var router35 = import_express35.default.Router();
var executionStatus31 = /* @__PURE__ */ new Map();
var paramsSchema28 = import_zod31.z.object({
  employee_id: import_zod31.z.number().optional(),
  token: import_zod31.z.string(),
  selectedFirstDate: import_zod31.z.string().min(1),
  selectedLastDate: import_zod31.z.string().min(1)
});
router35.post("/manage/view_production", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus31.has(ip) && executionStatus31.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus31.set(ip, true);
    const { employee_id, token, selectedFirstDate, selectedLastDate } = paramsSchema28.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken31.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          console.log("selectedLastDate: ", selectedLastDate);
          console.log("selectedFirstDate: ", selectedFirstDate);
          const firstFormatted = (0, import_moment.default)(selectedFirstDate).hour(0).minute(0).second(0).format("YYYY-MM-DD HH:mm:ss");
          const lastFormatted = (0, import_moment.default)(selectedLastDate).hour(23).minute(59).second(59).format("YYYY-MM-DD HH:mm:ss");
          const sql1 = `
      SELECT list_service 
      FROM tbl_operations_logs 
      WHERE employee_id = ? 
        AND status = ? 
        AND finished_at >= ? 
        AND finished_at <= ?
      ORDER BY id DESC;
    `;
          const sql2 = "SELECT * FROM tbl_service_catalog";
          const values = [employee_id, "concluded", firstFormatted, lastFormatted];
          const currentOperation = await executeQuery(sql1, values);
          const serviceList = await executeQuery(sql2);
          res.json({ currentOperation: [...currentOperation], serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken31.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken31.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod31.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus31.set(ip, false);
  }
});
var view_production_default = router35;

// src/routes/superadmin/manage/service-enabler-and-disabler/index.ts
var import_express36 = __toESM(require("express"));
var import_jsonwebtoken32 = __toESM(require("jsonwebtoken"));
var import_zod32 = require("zod");
var router36 = import_express36.default.Router();
var paramsSchema29 = import_zod32.z.object({
  token: import_zod32.z.string().min(1),
  modificationId: import_zod32.z.string().optional(),
  status: import_zod32.z.enum(["ativo", "inativo"]).optional()
});
var executionStatus32 = /* @__PURE__ */ new Map();
router36.post("/manage/service-enabler-and-disabler", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus32.has(ip) && executionStatus32.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus32.set(ip, true);
    const { token, status, modificationId } = paramsSchema29.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken32.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sqlUpdate = "UPDATE tbl_service_catalog SET status = ? WHERE id = ?";
          const sqlSelect = "SELECT * FROM tbl_service_catalog";
          if (modificationId && status) {
            await executeQuery(sqlUpdate, [status, modificationId]);
          }
          const serviceList = await executeQuery(sqlSelect);
          res.json(serviceList);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken32.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken32.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod32.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus32.set(ip, false);
  }
});
var service_enabler_and_disabler_default = router36;

// src/routes/superadmin/manage/index.ts
var import_zod33 = require("zod");
var router37 = import_express37.default.Router();
var paramsSchema30 = import_zod33.z.object({ token: import_zod33.z.string() });
var executionStatus33 = /* @__PURE__ */ new Map();
router37.post("/manage", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus33.has(ip) && executionStatus33.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus33.set(ip, true);
    const { token } = paramsSchema30.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken33.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
          const roles = ["superadmin", "admin", "almox", "cop", "config"];
          const rows = await executeQuery(sql, roles);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken33.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken33.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod33.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus33.set(ip, false);
  }
});
router37.use(new_default3);
router37.use(historic_default3);
router37.use(view_production_default);
router37.use(update_password_employee_default2);
router37.use(update_status_employee_default2);
router37.use(service_enabler_and_disabler_default);
var manage_default2 = router37;

// src/routes/superadmin/running/index.ts
var import_express45 = __toESM(require("express"));
var import_jsonwebtoken40 = __toESM(require("jsonwebtoken"));

// src/routes/superadmin/running/finish/index.ts
var import_express41 = __toESM(require("express"));

// src/routes/superadmin/running/finish/concluded/index.ts
var import_express38 = __toESM(require("express"));
var import_jsonwebtoken34 = __toESM(require("jsonwebtoken"));
var import_zod34 = require("zod");
var router38 = import_express38.default.Router();
var paramsSchema31 = import_zod34.z.object({
  token: import_zod34.z.string(),
  employeeId: import_zod34.z.string().min(1),
  protocol: import_zod34.z.string().max(17),
  observation: import_zod34.z.string().max(500).optional(),
  listService: import_zod34.z.string(),
  listMaterial: import_zod34.z.string().optional()
});
var executionStatus34 = /* @__PURE__ */ new Map();
router38.post("/concluded", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus34.has(ip) && executionStatus34.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus34.set(ip, true);
    const { token, employeeId, protocol, observation, listService, listMaterial } = paramsSchema31.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken34.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(sql, [employeeId, protocol]);
          if (!row) {
            console.error("Requisi\xE7\xE3o inv\xE1lida");
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lida" });
          }
          if (row.status === "concluded") {
            console.error("Servi\xE7o j\xE1 conclu\xEDdo");
            return res.status(409).json({ error: "Servi\xE7o j\xE1 conclu\xEDdo" });
          }
          const executeTransactionArray = [];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const deleteValues = [row.employee_id, row.protocol];
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "concluded";
          const createStateModificationHistoryRecord = await insert_state_modification({
            row,
            newStatus,
            listMaterial,
            listService,
            observation
          });
          executeTransactionArray.push(createStateModificationHistoryRecord);
          if (row.status !== "analysis" && listMaterial) {
            const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
            executeTransactionArray.push(decrementStockItemQuantityEmployee);
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken34.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken34.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod34.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus34.set(ip, false);
  }
});
var concluded_default3 = router38;

// src/routes/superadmin/running/finish/select-material/index.ts
var import_express39 = __toESM(require("express"));
var import_jsonwebtoken35 = __toESM(require("jsonwebtoken"));
var import_zod35 = require("zod");
var router39 = import_express39.default.Router();
var paramsSchema32 = import_zod35.z.object({
  token: import_zod35.z.string(),
  employeeId: import_zod35.z.string(),
  protocol: import_zod35.z.string().max(17)
});
var executionStatus35 = /* @__PURE__ */ new Map();
router39.post("/running/finish/select-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus35.has(ip) && executionStatus35.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus35.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema32.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken35.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const rows = await executeQuery(sql, [employeeId, protocol, status]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken35.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken35.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod35.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus35.set(ip, false);
  }
});
var select_material_default3 = router39;

// src/routes/superadmin/running/finish/select-service/index.ts
var import_express40 = __toESM(require("express"));
var import_jsonwebtoken36 = __toESM(require("jsonwebtoken"));
var import_zod36 = require("zod");
var router40 = import_express40.default.Router();
var paramsSchema33 = import_zod36.z.object({
  token: import_zod36.z.string().min(1),
  employeeId: import_zod36.z.string().min(1),
  protocol: import_zod36.z.string().max(17)
});
var executionStatus36 = /* @__PURE__ */ new Map();
router40.post("/running/finish/select-service", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus36.has(ip) && executionStatus36.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus36.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema33.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken36.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql1 = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const sql2 = "SELECT * FROM tbl_service_catalog WHERE status = ?";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, status]);
          const serviceList = await executeQuery(sql2, ["ativo"]);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken36.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken36.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod36.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus36.set(ip, false);
  }
});
var select_service_default3 = router40;

// src/routes/superadmin/running/finish/index.ts
var router41 = import_express41.default.Router();
router41.use(concluded_default3);
router41.use(select_material_default3);
router41.use(select_service_default3);
var finish_default3 = router41;

// src/routes/superadmin/running/cancel/index.ts
var import_express42 = __toESM(require("express"));
var import_jsonwebtoken37 = __toESM(require("jsonwebtoken"));
var import_zod37 = require("zod");
var router42 = import_express42.default.Router();
var paramsSchema34 = import_zod37.z.object({
  token: import_zod37.z.string(),
  employeeId: import_zod37.z.string(),
  protocol: import_zod37.z.string().max(17)
});
var executionStatus37 = /* @__PURE__ */ new Map();
router42.post("/running/cancel", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus37.has(ip) && executionStatus37.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus37.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema34.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken37.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          if (row.status === "canceled") {
            return res.status(409).json({ error: "Servi\xE7o j\xE1 pausado" });
          }
          const executeTransactionArray = [];
          const deleteValues = [row.employee_id, row.protocol];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "canceled";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          if (row.status === "analysis" && row.list_material) {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken37.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken37.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod37.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus37.set(ip, false);
  }
});
var cancel_default3 = router42;

// src/routes/superadmin/running/pause/index.ts
var import_express43 = __toESM(require("express"));
var import_jsonwebtoken38 = __toESM(require("jsonwebtoken"));
var import_zod38 = require("zod");
var paramsSchema35 = import_zod38.z.object({
  token: import_zod38.z.string(),
  employeeId: import_zod38.z.string().min(1),
  protocol: import_zod38.z.string().max(17)
});
var router43 = import_express43.default.Router();
var executionStatus38 = /* @__PURE__ */ new Map();
router43.post("/running/pause", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus38.has(ip) && executionStatus38.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus38.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema35.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken38.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          if (error) {
            executionStatus38.set(ip, false);
          }
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol, "active"]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const newStatus = "paused";
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { ...updateStateModificationService },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken38.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken38.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod38.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus38.set(ip, false);
  }
});
var pause_default3 = router43;

// src/routes/superadmin/running/start/index.ts
var import_express44 = __toESM(require("express"));
var import_jsonwebtoken39 = __toESM(require("jsonwebtoken"));
var import_zod39 = require("zod");
var router44 = import_express44.default.Router();
var paramsSchema36 = import_zod39.z.object({
  token: import_zod39.z.string(),
  employeeId: import_zod39.z.string().min(1),
  protocol: import_zod39.z.string().max(17)
});
var executionStatus39 = /* @__PURE__ */ new Map();
router44.post("/running/start", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus39.has(ip) && executionStatus39.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus39.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema36.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken39.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          const executeTransactionArray = [];
          const newStatus = "active";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...updateStateModificationService });
          if (row.status === "analysis") {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken39.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken39.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod39.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus39.set(ip, false);
  }
});
var start_default3 = router44;

// src/routes/superadmin/running/index.ts
var import_zod40 = require("zod");
var router45 = import_express45.default.Router();
var executionStatus40 = /* @__PURE__ */ new Map();
router45.post("/running", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus40.has(ip) && executionStatus40.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus40.set(ip, true);
    const paramsSchema61 = import_zod40.z.object({ token: import_zod40.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken40.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
      SELECT u1.*, 
      tec_user.name AS name_tec, 
      creator_leader_user.name AS name_creator_leader, 
      creator_leader_user.role AS role_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      ORDER BY u1.created_at DESC;
    `;
          const rows = await executeQuery(sql);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken40.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken40.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod40.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus40.set(ip, false);
  }
});
router45.use(finish_default3);
router45.use(cancel_default3);
router45.use(pause_default3);
router45.use(start_default3);
var running_default3 = router45;

// src/routes/superadmin/register-employee/index.ts
var import_express46 = __toESM(require("express"));
var import_jsonwebtoken41 = __toESM(require("jsonwebtoken"));
var import_bcryptjs6 = __toESM(require("bcryptjs"));
var import_zod41 = require("zod");
var router46 = import_express46.default.Router();
var noNumbers2 = /^[^0-9]*$/;
var isCnpj2 = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
var isCpf2 = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
var paramsSchema37 = import_zod41.z.object({
  name: import_zod41.z.string().min(1).regex(noNumbers2),
  identification: import_zod41.z.string().refine((value) => isCnpj2.test(value) || isCpf2.test(value)),
  password: import_zod41.z.string().min(1).trim(),
  accountType: import_zod41.z.enum(["TEC", "DIR", "ALMOX", "COP"]),
  token: import_zod41.z.string()
});
function getCurrentDateTime7() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus41 = /* @__PURE__ */ new Map();
router46.post("/register-employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus41.has(ip) && executionStatus41.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus41.set(ip, true);
    const {
      name,
      identification,
      password,
      accountType,
      token
    } = paramsSchema37.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken41.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime7();
          const hash = import_bcryptjs6.default.hashSync(password, 10);
          const values = [
            name,
            accountType.toLowerCase(),
            "1234",
            "active",
            identification,
            hash,
            createdAt
          ];
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE identification = ?";
          const rows = await executeQuery(sqlSelect, [identification]);
          if (rows.length > 0) {
            res.json({ status: "already registered" });
            console.log("Funcion\xE1rio(a) n\xE3o registrado!");
            return;
          }
          const sqlInsert = "INSERT INTO tbl_user_accounts ( name, role, team, status, identification, password, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ?)";
          await executeQuery(sqlInsert, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken41.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken41.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod41.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus41.set(ip, false);
  }
});
var register_employee_default2 = router46;

// src/routes/superadmin/register-service/index.ts
var import_express47 = __toESM(require("express"));
var import_jsonwebtoken42 = __toESM(require("jsonwebtoken"));
var import_zod42 = require("zod");
var router47 = import_express47.default.Router();
var paramsSchema38 = import_zod42.z.object({
  description: import_zod42.z.string().min(1).transform((text) => text.toUpperCase()),
  status: import_zod42.z.enum(["ativo", "inativo"]),
  observation: import_zod42.z.string().max(500).optional(),
  token: import_zod42.z.string()
});
function getCurrentDateTime8() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus42 = /* @__PURE__ */ new Map();
router47.post("/register-service", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus42.has(ip) && executionStatus42.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus42.set(ip, true);
    const {
      description,
      status,
      observation,
      token
    } = paramsSchema38.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken42.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime8();
          const values = [
            description,
            status,
            observation,
            createdAt
          ];
          const sqlInsert = "INSERT INTO tbl_service_catalog ( description, status, observation, created_at) VALUES ( ?, ?, ?, ?)";
          await executeQuery(sqlInsert, values);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken42.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken42.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod42.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus42.set(ip, false);
  }
});
var register_service_default = router47;

// src/routes/superadmin/index.ts
var router48 = import_express48.default.Router();
router48.use(manage_default2);
router48.use(running_default3);
router48.use(register_employee_default2);
router48.use(register_service_default);
var superadmin_default = router48;

// src/routes/config/index.ts
var import_express51 = __toESM(require("express"));

// src/routes/config/select-theme/index.ts
var import_express49 = __toESM(require("express"));
var import_jsonwebtoken43 = __toESM(require("jsonwebtoken"));
var import_zod43 = require("zod");
var router49 = import_express49.default.Router();
var paramsSchema39 = import_zod43.z.object({
  bussines: import_zod43.z.string().min(1).optional(),
  token: import_zod43.z.string()
});
var executionStatus43 = /* @__PURE__ */ new Map();
router49.post("/select-theme", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus43.has(ip) && executionStatus43.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus43.set(ip, true);
    const { bussines, token } = paramsSchema39.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken43.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          if (bussines) {
            await setRedis("company", bussines);
          }
          const company = await getRedis("company");
          res.json(company);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken43.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken43.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod43.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus43.set(ip, false);
  }
});
var select_theme_default = router49;

// src/routes/config/disconnect-everything/index.ts
var import_express50 = __toESM(require("express"));
var import_jsonwebtoken44 = __toESM(require("jsonwebtoken"));
var import_zod44 = require("zod");
var router50 = import_express50.default.Router();
var paramsSchema40 = import_zod44.z.object({
  token: import_zod44.z.string()
});
var executionStatus44 = /* @__PURE__ */ new Map();
function getRandomSSID(comprimento = 10) {
  return Math.random().toString(36).slice(2, comprimento);
}
router50.post("/disconnect-everything", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus44.has(ip) && executionStatus44.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus44.set(ip, true);
    const { token } = paramsSchema40.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken44.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const ssid = getRandomSSID();
          await setRedis("_session_ssid", ssid);
          const socket = await websocket(token);
          socket.emit("ALL_REMOTE_LOGOUT_USER");
          res.json({ success: true });
          socket.close();
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken44.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken44.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod44.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus44.set(ip, false);
  }
});
var disconnect_everything_default = router50;

// src/routes/config/index.ts
var router51 = import_express51.default.Router();
router51.use(select_theme_default);
router51.use(disconnect_everything_default);
var config_default = router51;

// src/routes/cop/index.ts
var import_express64 = __toESM(require("express"));

// src/routes/cop/manage/index.ts
var import_express55 = __toESM(require("express"));
var import_jsonwebtoken48 = __toESM(require("jsonwebtoken"));

// src/routes/cop/manage/new/index.ts
var import_express52 = __toESM(require("express"));
var import_jsonwebtoken45 = __toESM(require("jsonwebtoken"));
var import_zod45 = require("zod");
function getCurrentDateTime9(date) {
  const now = date ? new Date(date) : /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var router52 = import_express52.default.Router();
var paramsSchema41 = import_zod45.z.object({
  employeeId: import_zod45.z.number().min(1),
  clientName: import_zod45.z.string().min(1).regex(/^[^0-9]*$/),
  city: import_zod45.z.string().min(1).regex(/^[^0-9]*$/),
  classification: import_zod45.z.string().min(1).max(2),
  nomenclature: import_zod45.z.string().min(1),
  address: import_zod45.z.string().min(1),
  startServiceAt: import_zod45.z.string().refine((dateString) => {
    const currentDate = /* @__PURE__ */ new Date();
    const inputDate = new Date(dateString);
    currentDate.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= currentDate;
  }, {
    message: "A data de in\xEDcio do servi\xE7o n\xE3o pode ser anterior \xE0 data atual"
  }),
  token: import_zod45.z.string()
});
var executionStatus45 = /* @__PURE__ */ new Map();
router52.post("/manage/new", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus45.has(ip) && executionStatus45.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus45.set(ip, true);
    const {
      employeeId,
      clientName,
      city,
      classification,
      nomenclature,
      address,
      startServiceAt,
      token
    } = paramsSchema41.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken45.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime9();
          const getStartServiceAt = getCurrentDateTime9(startServiceAt);
          const protocol = createProtocol(17);
          const status = "active";
          const updateCount = 0;
          const { user: cop } = decoded;
          const values = [
            protocol,
            employeeId,
            cop.id,
            clientName,
            city,
            classification,
            nomenclature,
            address,
            status,
            updateCount,
            getStartServiceAt,
            null,
            null,
            null,
            createdAt,
            null,
            null
          ];
          const queryOperations = `
      INSERT INTO tbl_operations (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          const queryOperationsHistory = `
      INSERT INTO tbl_operations_logs (
          protocol, 
          employee_id, 
          creator_leader_id, 
          client_name, 
          city, 
          classification, 
          nomenclature, 
          address, 
          status, 
          update_count, 
          start_service_at,
          list_service, 
          list_material, 
          observation, 
          created_at, 
          modification_at, 
          finished_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
          await executeTransaction([
            { query: queryOperations, values },
            { query: queryOperationsHistory, values }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: employeeId }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken45.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken45.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod45.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus45.set(ip, false);
  }
});
var new_default4 = router52;

// src/routes/cop/manage/historic/index.ts
var import_express54 = __toESM(require("express"));
var import_jsonwebtoken47 = __toESM(require("jsonwebtoken"));

// src/routes/cop/manage/historic/details/index.ts
var import_express53 = __toESM(require("express"));
var import_jsonwebtoken46 = __toESM(require("jsonwebtoken"));
var import_zod46 = require("zod");
var router53 = import_express53.default.Router();
var paramsSchema42 = import_zod46.z.object({
  token: import_zod46.z.string(),
  employeeId: import_zod46.z.string().min(1),
  protocol: import_zod46.z.string().max(17),
  updateCount: import_zod46.z.string().min(1).transform((item) => Number(item))
});
var executionStatus46 = /* @__PURE__ */ new Map();
router53.post("/manage/historic/details", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus46.has(ip) && executionStatus46.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus46.set(ip, true);
    const { token, employeeId, protocol, updateCount } = paramsSchema42.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken46.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql1 = `
      SELECT u1.*, tec_user.name AS name_tec, creator_leader_user.name AS name_creator_leader, creator_leader_user.role AS role_creator_leader
      FROM tbl_operations_logs u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      WHERE employee_id = ? AND protocol = ? AND update_count = ?
      ORDER BY u1.created_at DESC;
      `;
          const sql2 = "SELECT * FROM tbl_service_catalog";
          const serviceList = await executeQuery(sql2);
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, updateCount]);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken46.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken46.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod46.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus46.set(ip, false);
  }
});
var details_default4 = router53;

// src/routes/cop/manage/historic/index.ts
var import_zod47 = require("zod");
var router54 = import_express54.default.Router();
var executionStatus47 = /* @__PURE__ */ new Map();
var paramsSchema43 = import_zod47.z.object({
  employee_all: import_zod47.z.boolean().optional(),
  employee_id: import_zod47.z.number().optional(),
  initial_id: import_zod47.z.number().nullable().optional(),
  token: import_zod47.z.string()
});
router54.post("/manage/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus47.has(ip) && executionStatus47.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus47.set(ip, true);
    const { employee_all, employee_id, initial_id, token } = paramsSchema43.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken47.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectEmployee = async (initial_id2, employee_id2) => {
            const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            if (!initial_id2) return await executeQuery(sqlFirst, [employee_id2]);
            return await executeQuery(sqlLast, [initial_id2, employee_id2]);
          };
          const selectEmployeeAll = async (initial_id2) => {
            const sqlFirst = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
        ORDER BY id DESC
        LIMIT 10;
        `;
            const sqlLast = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < ?
        ORDER BY id DESC
        LIMIT 10;
        `;
            if (!initial_id2) return await executeQuery(sqlFirst);
            return await executeQuery(sqlLast, [initial_id2]);
          };
          const resultEmployeeAll = await selectEmployeeAll(initial_id);
          const resultEmployee = await selectEmployee(initial_id, employee_id);
          res.json(employee_all ? resultEmployeeAll : resultEmployee);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken47.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken47.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod47.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus47.set(ip, false);
  }
});
router54.use(details_default4);
var historic_default4 = router54;

// src/routes/cop/manage/index.ts
var import_zod48 = require("zod");
var router55 = import_express55.default.Router();
var paramsSchema44 = import_zod48.z.object({ token: import_zod48.z.string() });
var executionStatus48 = /* @__PURE__ */ new Map();
router55.post("/manage", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus48.has(ip) && executionStatus48.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus48.set(ip, true);
    const { token } = paramsSchema44.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken48.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
          const roles = ["superadmin", "admin", "almox", "cop", "config"];
          const rows = await executeQuery(sql, roles);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken48.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken48.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod48.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus48.set(ip, false);
  }
});
router55.use(new_default4);
router55.use(historic_default4);
var manage_default3 = router55;

// src/routes/cop/running/index.ts
var import_express63 = __toESM(require("express"));
var import_jsonwebtoken55 = __toESM(require("jsonwebtoken"));

// src/routes/cop/running/finish/index.ts
var import_express59 = __toESM(require("express"));

// src/routes/cop/running/finish/concluded/index.ts
var import_express56 = __toESM(require("express"));
var import_jsonwebtoken49 = __toESM(require("jsonwebtoken"));
var import_zod49 = require("zod");
var router56 = import_express56.default.Router();
var paramsSchema45 = import_zod49.z.object({
  token: import_zod49.z.string(),
  employeeId: import_zod49.z.string().min(1),
  protocol: import_zod49.z.string().max(17),
  observation: import_zod49.z.string().max(500).optional(),
  listService: import_zod49.z.string(),
  listMaterial: import_zod49.z.string().optional()
});
var executionStatus49 = /* @__PURE__ */ new Map();
router56.post("/concluded", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus49.has(ip) && executionStatus49.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus49.set(ip, true);
    const body = paramsSchema45.parse(req.body);
    const { token, employeeId, protocol, observation, listService, listMaterial } = body;
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken49.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(sql, [employeeId, protocol]);
          if (!row) {
            console.error("Requisi\xE7\xE3o inv\xE1lida");
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lida" });
          }
          if (row.status === "concluded") {
            console.error("Servi\xE7o j\xE1 conclu\xEDdo");
            return res.status(409).json({ error: "Servi\xE7o j\xE1 conclu\xEDdo" });
          }
          const executeTransactionArray = [];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const deleteValues = [row.employee_id, row.protocol];
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "concluded";
          const createStateModificationHistoryRecord = await insert_state_modification({
            row,
            newStatus,
            listMaterial,
            listService,
            observation
          });
          executeTransactionArray.push(createStateModificationHistoryRecord);
          if (row.status !== "analysis" && listMaterial) {
            const decrementStockItemQuantityEmployee = await decrement_item(listMaterial);
            executeTransactionArray.push(decrementStockItemQuantityEmployee);
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken49.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken49.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod49.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus49.set(ip, false);
  }
});
var concluded_default4 = router56;

// src/routes/cop/running/finish/select-material/index.ts
var import_express57 = __toESM(require("express"));
var import_jsonwebtoken50 = __toESM(require("jsonwebtoken"));
var import_zod50 = require("zod");
var router57 = import_express57.default.Router();
var paramsSchema46 = import_zod50.z.object({
  token: import_zod50.z.string(),
  employeeId: import_zod50.z.string(),
  protocol: import_zod50.z.string().max(17)
});
var executionStatus50 = /* @__PURE__ */ new Map();
router57.post("/running/finish/select-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus50.has(ip) && executionStatus50.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus50.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema46.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken50.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const rows = await executeQuery(sql, [employeeId, protocol, status]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken50.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken50.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod50.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus50.set(ip, false);
  }
});
var select_material_default4 = router57;

// src/routes/cop/running/finish/select-service/index.ts
var import_express58 = __toESM(require("express"));
var import_jsonwebtoken51 = __toESM(require("jsonwebtoken"));
var import_zod51 = require("zod");
var router58 = import_express58.default.Router();
var paramsSchema47 = import_zod51.z.object({
  token: import_zod51.z.string().min(1),
  employeeId: import_zod51.z.string().min(1),
  protocol: import_zod51.z.string().max(17)
});
var executionStatus51 = /* @__PURE__ */ new Map();
router58.post("/running/finish/select-service", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus51.has(ip) && executionStatus51.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus51.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema47.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken51.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const status = "finished";
          const sql1 = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status <> ?";
          const sql2 = "SELECT * FROM tbl_service_catalog WHERE status = ?";
          const currentOperation = await executeQuery(sql1, [employeeId, protocol, status]);
          const serviceList = await executeQuery(sql2, ["ativo"]);
          res.json({ currentOperation, serviceList });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken51.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken51.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod51.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus51.set(ip, false);
  }
});
var select_service_default4 = router58;

// src/routes/cop/running/finish/index.ts
var router59 = import_express59.default.Router();
router59.use(concluded_default4);
router59.use(select_material_default4);
router59.use(select_service_default4);
var finish_default4 = router59;

// src/routes/cop/running/cancel/index.ts
var import_express60 = __toESM(require("express"));
var import_jsonwebtoken52 = __toESM(require("jsonwebtoken"));
var import_zod52 = require("zod");
var router60 = import_express60.default.Router();
var paramsSchema48 = import_zod52.z.object({
  token: import_zod52.z.string(),
  employeeId: import_zod52.z.string(),
  protocol: import_zod52.z.string().max(17)
});
var executionStatus52 = /* @__PURE__ */ new Map();
router60.post("/running/cancel", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus52.has(ip) && executionStatus52.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus52.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema48.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken52.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          if (row.status === "canceled") {
            return res.status(409).json({ error: "Servi\xE7o j\xE1 pausado" });
          }
          const executeTransactionArray = [];
          const deleteValues = [row.employee_id, row.protocol];
          const queryOperations = "DELETE FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          executeTransactionArray.push({ query: queryOperations, values: deleteValues });
          const newStatus = "canceled";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          if (row.status === "analysis" && row.list_material) {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken52.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken52.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod52.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus52.set(ip, false);
  }
});
var cancel_default4 = router60;

// src/routes/cop/running/pause/index.ts
var import_express61 = __toESM(require("express"));
var import_jsonwebtoken53 = __toESM(require("jsonwebtoken"));
var import_zod53 = require("zod");
var paramsSchema49 = import_zod53.z.object({
  token: import_zod53.z.string(),
  employeeId: import_zod53.z.string().min(1),
  protocol: import_zod53.z.string().max(17)
});
var router61 = import_express61.default.Router();
var executionStatus53 = /* @__PURE__ */ new Map();
router61.post("/running/pause", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus53.has(ip) && executionStatus53.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus53.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema49.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken53.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          if (error) {
            executionStatus53.set(ip, false);
          }
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ? AND status = ?";
          const [rowQuery] = await executeQuery(selectSql, [employeeId, protocol, "active"]);
          const row = rowQuery;
          if (!row) {
            return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lido" });
          }
          const newStatus = "paused";
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          await executeTransaction([
            { ...updateStateModificationService },
            { ...createStateModificationHistoryRecord }
          ]);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken53.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken53.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod53.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus53.set(ip, false);
  }
});
var pause_default4 = router61;

// src/routes/cop/running/start/index.ts
var import_express62 = __toESM(require("express"));
var import_jsonwebtoken54 = __toESM(require("jsonwebtoken"));
var import_zod54 = require("zod");
var router62 = import_express62.default.Router();
var paramsSchema50 = import_zod54.z.object({
  token: import_zod54.z.string(),
  employeeId: import_zod54.z.string().min(1),
  protocol: import_zod54.z.string().max(17)
});
var executionStatus54 = /* @__PURE__ */ new Map();
router62.post("/running/start", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus54.has(ip) && executionStatus54.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus54.set(ip, true);
    const { token, employeeId, protocol } = paramsSchema50.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken54.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectSql = "SELECT * FROM tbl_operations WHERE employee_id = ? AND protocol = ?";
          const [row] = await executeQuery(selectSql, [employeeId, protocol]);
          const executeTransactionArray = [];
          const newStatus = "active";
          const createStateModificationHistoryRecord = await insert_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...createStateModificationHistoryRecord });
          const updateStateModificationService = await update_state_modification({ row, newStatus });
          executeTransactionArray.push({ ...updateStateModificationService });
          if (row.status === "analysis") {
            const incrementStockItemQuantityEmployee = await increment_item(row.list_material);
            executeTransactionArray.push({ ...incrementStockItemQuantityEmployee });
          }
          await executeTransaction(executeTransactionArray);
          const socket = await websocket(token);
          socket.emit("RUNNING_REFRESH", JSON.stringify({ employee_id: row.employee_id }));
          res.json({ success: true });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken54.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken54.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod54.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus54.set(ip, false);
  }
});
var start_default4 = router62;

// src/routes/cop/running/index.ts
var import_zod55 = require("zod");
var router63 = import_express63.default.Router();
var executionStatus55 = /* @__PURE__ */ new Map();
router63.post("/running", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus55.has(ip) && executionStatus55.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus55.set(ip, true);
    const paramsSchema61 = import_zod55.z.object({ token: import_zod55.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken55.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
      SELECT u1.*, 
      tec_user.name AS name_tec, 
      creator_leader_user.name AS name_creator_leader, 
      creator_leader_user.role AS role_creator_leader
      FROM tbl_operations u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      LEFT JOIN tbl_user_accounts creator_leader_user ON u1.creator_leader_id = creator_leader_user.id
      ORDER BY u1.created_at DESC;
    `;
          const rows = await executeQuery(sql);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken55.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken55.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod55.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus55.set(ip, false);
  }
});
router63.use(finish_default4);
router63.use(cancel_default4);
router63.use(pause_default4);
router63.use(start_default4);
var running_default4 = router63;

// src/routes/cop/index.ts
var router64 = import_express64.default.Router();
router64.use(manage_default3);
router64.use(running_default4);
var cop_default = router64;

// src/routes/auth/index.ts
var import_express67 = __toESM(require("express"));

// src/routes/auth/signin/index.ts
var import_express65 = __toESM(require("express"));
var import_bcryptjs7 = __toESM(require("bcryptjs"));
var import_zod56 = require("zod");
var router65 = import_express65.default.Router();
var paramsSchema51 = import_zod56.z.object({
  identification: import_zod56.z.string().refine((value) => {
    const isCnpj3 = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value);
    const isCpf3 = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
    return isCnpj3 || isCpf3;
  }),
  password: import_zod56.z.string().min(1)
});
router65.post("/signin", async (req, res) => {
  try {
    const { password, identification } = paramsSchema51.parse(req.body);
    const sql = "SELECT * FROM tbl_user_accounts WHERE identification = ?";
    const [userQuery] = await executeQuery(sql, [identification]);
    const user = userQuery;
    if (!user) {
      return res.status(401).send("Credenciais inv\xE1lidas");
    }
    const company = await getRedis("company") ?? "exatelecom";
    const ssid = await getRedis("_session_ssid") ?? "00000";
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
    const isPasswordValid = import_bcryptjs7.default.compareSync(password, user.password);
    if (isPasswordValid) {
      console.log("Login bem-sucedido. Token:");
      if (user.status === "inactive") {
        return res.status(403).send("forbidden");
      }
      res.json(content);
    } else {
      return res.status(401).send("Credenciais inv\xE1lidas");
    }
  } catch (error) {
    if (error instanceof import_zod56.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: "Requisi\xE7\xE3o inv\xE1lida", details: error.errors });
    } else {
      console.error("Erro interno no servidor:", error);
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  }
});
var signin_default = router65;

// src/routes/auth/data_user/index.ts
var import_express66 = __toESM(require("express"));
var import_jsonwebtoken56 = __toESM(require("jsonwebtoken"));
var import_zod57 = require("zod");
var router66 = import_express66.default.Router();
var paramsSchema52 = import_zod57.z.object({
  token: import_zod57.z.string()
});
var executionStatus56 = /* @__PURE__ */ new Map();
router66.post("/data_user", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus56.has(ip) && executionStatus56.get(ip) === true) {
    console.error("J\xE1 existe n uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus56.set(ip, true);
    const { token } = paramsSchema52.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken56.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const { user } = decoded;
          const sqlSelect = "SELECT * FROM tbl_user_accounts WHERE id = ?";
          const [data] = await executeQuery(sqlSelect, [user.id]);
          if (!data) {
            return res.status(401).send("Credenciais inv\xE1lidas");
          }
          res.json(data);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken56.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken56.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod57.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus56.set(ip, false);
  }
});
var data_user_default = router66;

// src/routes/auth/index.ts
var router67 = import_express67.default.Router();
router67.use(signin_default);
router67.use(data_user_default);
var auth_default = router67;

// src/routes/almox/index.ts
var import_express78 = __toESM(require("express"));

// src/routes/almox/stock/index.ts
var import_express70 = __toESM(require("express"));
var import_jsonwebtoken59 = __toESM(require("jsonwebtoken"));

// src/routes/almox/stock/select-employee/index.ts
var import_express69 = __toESM(require("express"));
var import_jsonwebtoken58 = __toESM(require("jsonwebtoken"));
var import_zod59 = require("zod");

// src/routes/almox/stock/select-employee/insert-maretial/index.ts
var import_express68 = __toESM(require("express"));
var import_jsonwebtoken57 = __toESM(require("jsonwebtoken"));

// src/models/stock_logs/material_operation.ts
function getCurrentDateTime10() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function material_operation({ insert, employeeId, transferType }) {
  function generatePlaceholders3(count) {
    let valueQuery = "";
    const placeholders = Array(count).fill("?").join(", ");
    for (let i = 0; i < insert.length; i++) {
      const valueSql = `(${placeholders})`;
      valueQuery += valueSql;
      if (i < insert.length - 1) {
        valueQuery += ", ";
      }
    }
    return valueQuery;
  }
  const createdAt = getCurrentDateTime10();
  const insertValueMaterialsEmployee = [];
  insert.forEach((item) => {
    insertValueMaterialsEmployee.push(
      employeeId,
      item.product_name,
      item.product_code,
      item.product_batch || null,
      item.quantity_value,
      item.unit_type,
      transferType,
      createdAt
    );
  });
  const queryMaterialsStock = `
  INSERT INTO tbl_stock_logs
    (employee_id, product_name, product_code, product_batch, quantity_value, unit_type, transfer_type, created_at) 
  VALUES 
    ${generatePlaceholders3(8)}`;
  return { query: queryMaterialsStock, values: insertValueMaterialsEmployee };
}

// src/routes/almox/stock/select-employee/insert-maretial/index.ts
var import_zod58 = require("zod");
var router68 = import_express68.default.Router();
var insertedMaterialSchema = import_zod58.z.array(import_zod58.z.object({
  id: import_zod58.z.number(),
  product_name: import_zod58.z.string(),
  unit_type: import_zod58.z.string(),
  product_code: import_zod58.z.string(),
  product_batch: import_zod58.z.string().nullable(),
  quantity_value: import_zod58.z.string(),
  created_at: import_zod58.z.string()
}));
var paramsSchema53 = import_zod58.z.object({
  insert: insertedMaterialSchema,
  employee_id: import_zod58.z.number(),
  token: import_zod58.z.string()
});
function generatePlaceholders(count, insert) {
  let valueQuery = "";
  const placeholders = Array(count).fill("?").join(", ");
  for (let i = 0; i < insert.length; i++) {
    const valueSql = `(${placeholders})`;
    valueQuery += valueSql;
    if (i < insert.length - 1) {
      valueQuery += ", ";
    }
  }
  return valueQuery;
}
function getCurrentDateTime11() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus57 = /* @__PURE__ */ new Map();
router68.post("/stock/select-employee/insert-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus57.has(ip) && executionStatus57.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus57.set(ip, true);
    const { insert, employee_id, token } = paramsSchema53.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken57.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime11();
          const updateValuesMaterialsStock = [];
          insert.forEach((item) => {
            updateValuesMaterialsStock.push(
              item.id,
              item.product_name,
              item.product_code,
              item.product_batch,
              item.quantity_value,
              item.unit_type,
              createdAt
            );
          });
          const insertValueMaterialsEmployee = [];
          insert.forEach((item) => {
            insertValueMaterialsEmployee.push(
              `${item.id}-${employee_id}`,
              employee_id,
              item.product_name,
              item.product_code,
              item.product_batch,
              item.quantity_value,
              item.unit_type,
              createdAt
            );
          });
          const queryMaterialsStock = `
      INSERT INTO tbl_stock_almox 
        (id, product_name, product_code, product_batch, quantity_value, unit_type, created_at) 
      VALUES 
        ${generatePlaceholders(7, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
          const queryMaterialsEmployee = `
      INSERT INTO tbl_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
      VALUES ${generatePlaceholders(8, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value + VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
          const queryMaterialsStockTransferLog = await material_operation({
            insert,
            employeeId: employee_id,
            transferType: "sent"
          });
          await executeTransaction([
            { query: queryMaterialsStock, values: updateValuesMaterialsStock },
            { query: queryMaterialsEmployee, values: insertValueMaterialsEmployee },
            { ...queryMaterialsStockTransferLog }
          ]);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken57.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken57.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod58.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus57.set(ip, false);
  }
});
var insert_maretial_default = router68;

// src/routes/almox/stock/select-employee/index.ts
var router69 = import_express69.default.Router();
var executionStatus58 = /* @__PURE__ */ new Map();
router69.post("/stock/select-employee", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus58.has(ip) && executionStatus58.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus58.set(ip, true);
    const paramsSchema61 = import_zod59.z.object({ token: import_zod59.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken58.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT id, role, name, identification, created_at FROM tbl_user_accounts WHERE role = ? ORDER BY created_at DESC";
          const rows = await executeQuery(sql, ["tec"]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken58.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken58.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod59.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus58.set(ip, false);
  }
});
router69.use(insert_maretial_default);
var select_employee_default = router69;

// src/routes/almox/stock/index.ts
var import_zod60 = require("zod");
var router70 = import_express70.default.Router();
var paramsSchema54 = import_zod60.z.object({
  token: import_zod60.z.string(),
  productAll: import_zod60.z.boolean(),
  productCode: import_zod60.z.string()
});
var executionStatus59 = /* @__PURE__ */ new Map();
router70.post("/stock", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus59.has(ip) && executionStatus59.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus59.set(ip, true);
    const { token, productAll, productCode } = paramsSchema54.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken59.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sqlproductAll = "SELECT * FROM tbl_stock_almox ORDER BY created_at DESC";
          const sqlProductCode = "SELECT * FROM tbl_stock_almox WHERE product_code = ?";
          const rows = productAll ? await executeQuery(sqlproductAll) : await executeQuery(sqlProductCode, [productCode]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken59.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken59.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod60.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus59.set(ip, false);
  }
});
router70.use(select_employee_default);
var stock_default2 = router70;

// src/routes/almox/manage/index.ts
var import_express74 = __toESM(require("express"));
var import_jsonwebtoken63 = __toESM(require("jsonwebtoken"));

// src/routes/almox/manage/historic/index.ts
var import_express72 = __toESM(require("express"));
var import_jsonwebtoken61 = __toESM(require("jsonwebtoken"));

// src/routes/almox/manage/historic/details/index.ts
var import_express71 = __toESM(require("express"));
var import_jsonwebtoken60 = __toESM(require("jsonwebtoken"));
var import_zod61 = require("zod");
var router71 = import_express71.default.Router();
var paramsSchema55 = import_zod61.z.object({
  token: import_zod61.z.string(),
  employeeId: import_zod61.z.string().min(1),
  protocol: import_zod61.z.string().max(17),
  updateCount: import_zod61.z.string().min(1).transform((item) => Number(item))
});
var executionStatus60 = /* @__PURE__ */ new Map();
router71.post("/manage/historic/details", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus60.has(ip) && executionStatus60.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus60.set(ip, true);
    const { token, employeeId, protocol, updateCount } = paramsSchema55.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken60.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = "SELECT * FROM tbl_operations_logs WHERE employee_id = ? AND protocol = ? AND update_count = ?";
          const rows = await executeQuery(sql, [employeeId, protocol, updateCount]);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken60.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken60.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod61.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus60.set(ip, false);
  }
});
var details_default5 = router71;

// src/routes/almox/manage/historic/index.ts
var import_zod62 = require("zod");
var router72 = import_express72.default.Router();
var executionStatus61 = /* @__PURE__ */ new Map();
var paramsSchema56 = import_zod62.z.object({
  employee_all: import_zod62.z.boolean().optional(),
  employee_id: import_zod62.z.number().optional(),
  initial_id: import_zod62.z.number().nullable().optional(),
  token: import_zod62.z.string()
});
router72.post("/manage/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus61.has(ip) && executionStatus61.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus61.set(ip, true);
    const { employee_all, employee_id, initial_id, token } = paramsSchema56.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken61.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const selectEmployee = async (initial_id2, employee_id2) => {
            const sqlFirst = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            const sqlLast = `
          SELECT u1.*, 
          tec_user.name AS name_tec, 
          creator_leader_user.name AS name_creator_leader
          FROM tbl_operations_logs u1
          JOIN tbl_user_accounts tec_user
          ON u1.employee_id = tec_user.id 
          LEFT JOIN tbl_user_accounts creator_leader_user
          ON u1.creator_leader_id = creator_leader_user.id
          WHERE u1.id < ?
          AND employee_id = ? 
          ORDER BY id DESC
          LIMIT 10;
          `;
            if (!initial_id2) return await executeQuery(sqlFirst, [employee_id2]);
            return await executeQuery(sqlLast, [initial_id2, employee_id2]);
          };
          const selectEmployeeAll = async (initial_id2) => {
            const sqlFirst = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < (SELECT MAX(id) FROM tbl_operations_logs) + 1
        ORDER BY id DESC
        LIMIT 10;
        `;
            const sqlLast = `
        SELECT u1.*, 
        tec_user.name AS name_tec, 
        creator_leader_user.name AS name_creator_leader
        FROM tbl_operations_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        LEFT JOIN tbl_user_accounts creator_leader_user
        ON u1.creator_leader_id = creator_leader_user.id
        WHERE u1.id < ?
        ORDER BY id DESC
        LIMIT 10;
        `;
            if (!initial_id2) return await executeQuery(sqlFirst);
            return await executeQuery(sqlLast, [initial_id2]);
          };
          const resultEmployeeAll = await selectEmployeeAll(initial_id);
          const resultEmployee = await selectEmployee(initial_id, employee_id);
          res.json(employee_all ? resultEmployeeAll : resultEmployee);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken61.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken61.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod62.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus61.set(ip, false);
  }
});
router72.use(details_default5);
var historic_default5 = router72;

// src/routes/almox/manage/pick-material/index.ts
var import_express73 = __toESM(require("express"));
var import_jsonwebtoken62 = __toESM(require("jsonwebtoken"));
var import_zod63 = require("zod");
var router73 = import_express73.default.Router();
var insertedMaterialSchema2 = import_zod63.z.array(import_zod63.z.object({
  id: import_zod63.z.string().min(1),
  product_name: import_zod63.z.string(),
  unit_type: import_zod63.z.string(),
  product_code: import_zod63.z.string(),
  product_batch: import_zod63.z.string().nullable(),
  quantity_value: import_zod63.z.string(),
  created_at: import_zod63.z.string()
}));
var paramsSchema57 = import_zod63.z.object({
  insert: insertedMaterialSchema2,
  employee_id: import_zod63.z.number(),
  token: import_zod63.z.string()
});
function generatePlaceholders2(count, insert) {
  let valueQuery = "";
  const placeholders = Array(count).fill("?").join(", ");
  for (let i = 0; i < insert.length; i++) {
    const valueSql = `(${placeholders})`;
    valueQuery += valueSql;
    if (i < insert.length - 1) {
      valueQuery += ", ";
    }
  }
  return valueQuery;
}
function getBeforeHyphen(text) {
  const parts = text.split("-");
  return Number(parts[0]);
}
function getCurrentDateTime12() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus62 = /* @__PURE__ */ new Map();
router73.post("/manage/pick-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus62.has(ip) && executionStatus62.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus62.set(ip, true);
    const { insert, employee_id, token } = paramsSchema57.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken62.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime12();
          const updateValuesMaterialsStock = [];
          insert.forEach((item) => {
            updateValuesMaterialsStock.push(
              getBeforeHyphen(item.id),
              item.product_name,
              item.product_code,
              item.product_batch,
              item.quantity_value,
              item.unit_type,
              createdAt
            );
          });
          const insertValueMaterialsEmployee = [];
          insert.forEach((item) => {
            insertValueMaterialsEmployee.push(
              item.id,
              employee_id,
              item.product_name,
              item.product_code,
              item.product_batch,
              item.quantity_value,
              item.unit_type,
              createdAt
            );
          });
          const queryMaterialsStock = `
      INSERT INTO tbl_stock_almox 
        (id, product_name, product_code, product_batch, quantity_value, unit_type, created_at) 
      VALUES 
        ${generatePlaceholders2(7, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value + VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
          const queryMaterialsEmployee = `
      INSERT INTO tbl_stock_employee 
        (id, employee_id, product_name, product_code, product_batch, quantity_value, unit_type, created_at)
      VALUES ${generatePlaceholders2(8, insert)}
      ON DUPLICATE KEY UPDATE 
        id = VALUES(id),
        employee_id = VALUES(employee_id),
        product_name = VALUES(product_name),
        product_code = VALUES(product_code),
        product_batch = VALUES(product_batch),
        quantity_value = quantity_value - VALUES(quantity_value),
        unit_type = VALUES(unit_type),
        created_at = VALUES(created_at);
      `;
          const queryMaterialsStockTransferLog = await material_operation({
            insert,
            employeeId: employee_id,
            transferType: "sent"
          });
          await executeTransaction([
            { query: queryMaterialsStock, values: updateValuesMaterialsStock },
            { query: queryMaterialsEmployee, values: insertValueMaterialsEmployee },
            { ...queryMaterialsStockTransferLog }
          ]);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken62.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken62.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod63.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus62.set(ip, false);
  }
});
var pick_material_default = router73;

// src/routes/almox/manage/index.ts
var import_zod64 = require("zod");
var router74 = import_express74.default.Router();
var executionStatus63 = /* @__PURE__ */ new Map();
router74.post("/manage", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus63.has(ip) && executionStatus63.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus63.set(ip, true);
    const paramsSchema61 = import_zod64.z.object({ token: import_zod64.z.string() });
    const { token } = paramsSchema61.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken63.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
        SELECT 
          id, 
          role, 
          name,
          status, 
          identification, 
          created_at
        FROM tbl_user_accounts 
        WHERE role <> ? AND role <> ? AND role <> ? AND role <> ? AND role <> ? ORDER BY created_at DESC`;
          const roles = ["superadmin", "admin", "almox", "cop", "config"];
          const rows = await executeQuery(sql, roles);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken63.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken63.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod64.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus63.set(ip, false);
  }
});
router74.use(historic_default5);
router74.use(pick_material_default);
var manage_default4 = router74;

// src/routes/almox/register-material/index.ts
var import_express75 = __toESM(require("express"));
var import_jsonwebtoken64 = __toESM(require("jsonwebtoken"));
var import_zod65 = require("zod");
var router75 = import_express75.default.Router();
var onlyNumbers = /^\d+$/;
var noSpaces = /^\S*$/;
var paramsSchema58 = import_zod65.z.object({
  productName: import_zod65.z.string().min(1).toUpperCase().trim(),
  productBatch: import_zod65.z.string().toUpperCase().regex(noSpaces).nullable(),
  productCode: import_zod65.z.string().min(1).regex(noSpaces).regex(onlyNumbers),
  quantityValue: import_zod65.z.string().min(1).regex(noSpaces).regex(onlyNumbers),
  unitType: import_zod65.z.enum(["UNID", "CX", "METRO"]),
  observation: import_zod65.z.string().max(500).nullable(),
  token: import_zod65.z.string()
});
function getCurrentDateTime13() {
  const now = /* @__PURE__ */ new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
var executionStatus64 = /* @__PURE__ */ new Map();
router75.post("/register-material", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus64.has(ip) && executionStatus64.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus64.set(ip, true);
    const {
      productName,
      productCode,
      productBatch,
      quantityValue,
      unitType,
      observation,
      token
    } = paramsSchema58.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken64.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const createdAt = getCurrentDateTime13();
          const values = [
            productName,
            productCode,
            productBatch,
            quantityValue,
            unitType,
            observation,
            createdAt
          ];
          const sqlSelect = "SELECT * FROM tbl_stock_almox WHERE product_code = ?";
          const rows = await executeQuery(sqlSelect, [productCode]);
          if (rows.length > 0) {
            res.json({ status: "already registered" });
            console.log("Produto j\xE1 registrado!");
            return;
          }
          const obj = {
            product_name: productName,
            unit_type: unitType,
            product_code: productCode,
            product_batch: productBatch,
            quantity_value: quantityValue,
            created_at: createdAt
          };
          const { user: employee } = decoded;
          const queryMaterialsStockOperationLog = await material_operation({
            insert: [obj],
            employeeId: employee.id,
            transferType: "sent"
          });
          const queryMaterialsStockRegister = "INSERT INTO tbl_stock_almox ( product_name, product_code, product_batch, quantity_value, unit_type, observation, created_at) VALUES ( ?, ?, ?, ?, ?, ?, ? )";
          await executeTransaction([
            { query: queryMaterialsStockRegister, values },
            { ...queryMaterialsStockOperationLog }
          ]);
          res.json({ status: "success" });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken64.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken64.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod65.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus64.set(ip, false);
  }
});
var register_material_default = router75;

// src/routes/almox/historic/index.ts
var import_express76 = __toESM(require("express"));
var import_jsonwebtoken65 = __toESM(require("jsonwebtoken"));
var import_zod66 = require("zod");
var router76 = import_express76.default.Router();
var paramsSchema59 = import_zod66.z.object({ token: import_zod66.z.string() });
var executionStatus65 = /* @__PURE__ */ new Map();
router76.post("/historic", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus65.has(ip) && executionStatus65.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus65.set(ip, true);
    const { token } = paramsSchema59.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken65.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sql = `
        SELECT u1.*, 
        tec_user.name AS name_tec,
        tec_user.role AS name_role
        FROM tbl_stock_logs u1
        JOIN tbl_user_accounts tec_user
        ON u1.employee_id = tec_user.id 
        ORDER BY u1.id DESC;
        `;
          const rows = await executeQuery(sql);
          res.json(rows);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken65.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken65.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod66.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus65.set(ip, false);
  }
});
var historic_default6 = router76;

// src/routes/almox/stock-view/index.ts
var import_express77 = __toESM(require("express"));
var import_jsonwebtoken66 = __toESM(require("jsonwebtoken"));
var import_zod67 = require("zod");
var router77 = import_express77.default.Router();
var paramsSchema60 = import_zod67.z.object({
  token: import_zod67.z.string()
});
var executionStatus66 = /* @__PURE__ */ new Map();
router77.post("/stock-view", async (req, res) => {
  const ip = req.ip;
  if (!ip) {
    console.error("IP n\xE3o fornecido");
    return res.status(409).json({ error: "IP n\xE3o fornecido" });
  }
  if (executionStatus66.has(ip) && executionStatus66.get(ip) === true) {
    console.error("J\xE1 existe uma execu\xE7\xE3o em andamento para este IP");
    return res.status(409).json({ error: "J\xE1 existe uma execu\xE7\xE3o em andamento para este IP" });
  }
  try {
    executionStatus66.set(ip, true);
    const { token } = paramsSchema60.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken66.default.verify(token, authenticationHash, async (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const sqlStockEmployee = `
      SELECT u1.*, tec_user.name AS name_tec
      FROM tbl_stock_employee u1
      JOIN tbl_user_accounts tec_user ON u1.employee_id = tec_user.id 
      ORDER BY u1.created_at DESC`;
          const sqlStockAlmox = "SELECT * FROM tbl_stock_almox ORDER BY created_at DESC";
          const rowsStockEmployee = await executeQuery(sqlStockEmployee);
          const rowsStockAlmox = await executeQuery(sqlStockAlmox);
          res.json({ employee: rowsStockEmployee, almox: rowsStockAlmox });
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    if (error instanceof import_jsonwebtoken66.TokenExpiredError) {
      console.log("Token expirado");
      return res.status(403).json({ error: "Token expirado" });
    }
    if (error instanceof import_jsonwebtoken66.JsonWebTokenError) {
      console.log("Token inv\xE1lido");
      return res.status(403).json({ error: "Token inv\xE1lido" });
    }
    if (error instanceof import_zod67.ZodError) {
      console.error("Requisi\xE7\xE3o inv\xE1lida Zod", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  } finally {
    executionStatus66.set(ip, false);
  }
});
var stock_view_default = router77;

// src/routes/almox/index.ts
var router78 = import_express78.default.Router();
router78.use(stock_default2);
router78.use(manage_default4);
router78.use(register_material_default);
router78.use(historic_default6);
router78.use(stock_view_default);
var almox_default = router78;

// src/server.ts
import_dotenv7.default.config();
var app = (0, import_express79.default)();
var server = import_http.default.createServer(app);
var frontendOriginBaseURL = process.env.FRONTEND_ORIGIN_BASEURL;
app.use((0, import_cookie_parser.default)());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", frontendOriginBaseURL);
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use((0, import_cors.default)({
  origin: frontendOriginBaseURL,
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(import_express79.default.json());
app.use("/api/tec", tec_default);
app.use("/api/admin", admin_default);
app.use("/api/superadmin", superadmin_default);
app.use("/api/config", config_default);
app.use("/api/cop", cop_default);
app.use("/api/auth", auth_default);
app.use("/api/almox", almox_default);
app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).send("Ocorreu um erro interno.");
});
var PORT = Number(process.env.PORT);
var ASCIIART = `%c 
       ######   ########   ########   ######
     ######       ########  #####       ######
  ######           ########  ##            ######
######               ########                ######
######                ########               ######
  ######            ##  ########           ######
     ######       #####  ########       ######
       ######   ########   ########   ######`;
server.listen(PORT, () => {
  console.log(ASCIIART, "color: #bada55");
  console.log(`Server running at port: ${PORT} | pid: ${process.pid} 
`);
});
//# sourceMappingURL=server.js.map