"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/models/stock_logs/material_operation.ts
var material_operation_exports = {};
__export(material_operation_exports, {
  material_operation: () => material_operation
});
module.exports = __toCommonJS(material_operation_exports);
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
function material_operation(_0) {
  return __async(this, arguments, function* ({ insert, employeeId, transferType }) {
    function generatePlaceholders(count) {
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
    const createdAt = getCurrentDateTime();
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
    ${generatePlaceholders(8)}`;
    return { query: queryMaterialsStock, values: insertValueMaterialsEmployee };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  material_operation
});
//# sourceMappingURL=material_operation.js.map