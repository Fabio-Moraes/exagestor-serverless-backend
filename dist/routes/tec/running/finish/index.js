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
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

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
    var fs2 = require("fs");
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
            if (fs2.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs2.existsSync(possibleVaultPath)) {
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
          const parsed = DotenvModule.parse(fs2.readFileSync(path2, { encoding }));
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

// src/routes/tec/running/finish/index.ts
var finish_exports = {};
__export(finish_exports, {
  default: () => finish_default
});
module.exports = __toCommonJS(finish_exports);
var import_express4 = __toESM(require("express"));

// src/routes/tec/running/finish/concluded/index.ts
var import_express = __toESM(require("express"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));

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
var import_fs = __toESM(require("fs"));
import_dotenv3.default.config();
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
      ca: import_fs.default.readFileSync(__dirname + "/certs/ca-cert.txt")
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

// src/routes/tec/running/finish/concluded/index.ts
var import_zod = require("zod");

// src/models/stock_employee/decrement_item.ts
async function decrement_item(materials) {
  function generateQueryListMaterial(arr) {
    const placeholders = arr.map(() => "?").join(", ");
    return `SELECT * FROM tbl_stock_employee WHERE id IN (${placeholders})`;
  }
  function generatePlaceholders(data) {
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
    VALUES ${generatePlaceholders(resultQueryListMaterial)}
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

// src/models/operation_logs/insert_state_modification.ts
function getCurrentDateTime() {
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
  const createdAt = getCurrentDateTime();
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

// src/models/operations/update_state_modification.ts
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
async function update_state_modification(props) {
  const createdAt = getCurrentDateTime2();
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

// src/routes/tec/running/finish/concluded/index.ts
var router = import_express.default.Router();
var paramsSchema = import_zod.z.object({
  token: import_zod.z.string(),
  protocol: import_zod.z.string().max(17),
  observation: import_zod.z.string().max(500).optional(),
  listService: import_zod.z.string(),
  listMaterial: import_zod.z.string().optional()
});
var executionStatus = /* @__PURE__ */ new Map();
router.post("/running/finish/concluded", async (req, res) => {
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
    const {
      token,
      protocol,
      observation,
      listMaterial,
      listService
    } = paramsSchema.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken.default.verify(token, authenticationHash, async (error, decoded) => {
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
var concluded_default = router;

// src/routes/tec/running/finish/select-material/index.ts
var import_express2 = __toESM(require("express"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var import_zod2 = require("zod");
var router2 = import_express2.default.Router();
var paramsSchema2 = import_zod2.z.object({
  token: import_zod2.z.string(),
  protocol: import_zod2.z.string().max(17)
});
var executionStatus2 = /* @__PURE__ */ new Map();
router2.post("/running/finish/select-material", async (req, res) => {
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
    const { token, protocol } = paramsSchema2.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken2.default.verify(token, authenticationHash, async (error, decoded) => {
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
var select_material_default = router2;

// src/routes/tec/running/finish/select-service/index.ts
var import_express3 = __toESM(require("express"));
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"));
var import_zod3 = require("zod");
var router3 = import_express3.default.Router();
var paramsSchema3 = import_zod3.z.object({
  token: import_zod3.z.string(),
  protocol: import_zod3.z.string().max(17)
});
var executionStatus3 = /* @__PURE__ */ new Map();
router3.post("/running/finish/select-service", async (req, res) => {
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
    const { token, protocol } = paramsSchema3.parse(req.body);
    const authenticationHash = await getAuthenticationHash();
    await new Promise((resolve, reject) => {
      import_jsonwebtoken3.default.verify(token, authenticationHash, async (error, decoded) => {
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
var select_service_default = router3;

// src/routes/tec/running/finish/index.ts
var router4 = import_express4.default.Router();
router4.use(concluded_default);
router4.use(select_material_default);
router4.use(select_service_default);
var finish_default = router4;
//# sourceMappingURL=index.js.map