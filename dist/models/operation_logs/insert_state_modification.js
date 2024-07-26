"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insert_state_modification = void 0;
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
async function insert_state_modification(props) {
    const createdAt = getCurrentDateTime();
    const { row, newStatus, listMaterial, listService, observation } = props;
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
        newStatus === 'concluded' ? row.modification_at : createdAt,
        listService ?? null,
        listMaterial ?? null,
        observation ?? null,
        newStatus === 'concluded' ? createdAt : null,
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
    return { query: queryOperations, values: values };
}
exports.insert_state_modification = insert_state_modification;
