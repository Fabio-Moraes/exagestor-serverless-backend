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

// src/models/operation_logs/index.ts
var operation_logs_exports = {};
__export(operation_logs_exports, {
  insert_state_modification: () => insert_state_modification
});
module.exports = __toCommonJS(operation_logs_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insert_state_modification
});
//# sourceMappingURL=index.js.map