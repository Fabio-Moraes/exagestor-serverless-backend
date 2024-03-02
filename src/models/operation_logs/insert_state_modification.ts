interface ServiceData {
  id: number;
  client_name: string;
  employee_id: string;
  admin_id?: string;
  city: string;
  address: string;
  nomenclature: string;
  classification: string;
  status: string;
  update_count: number;
  created_at: string;
  modification_at: string;
  finished_at: string;
  list_material: string;
  list_service: string;
  observation: string;
  protocol: string;
}

interface TypeProps {
  row: ServiceData,
  newStatus: 'paused' | 'active' | 'canceled' | 'analysis' | 'concluded';
  listMaterial?: string;
  listService?: string;
  observation?: string;
}

function getCurrentDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export async function insert_state_modification(props: TypeProps) {
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
    row.admin_id,
    row.client_name,
    row.city,
    row.classification,
    row.nomenclature,
    row.address,
    newStatus,
    row.update_count + 1,
    row.created_at,
    newStatus === 'concluded' ? row.modification_at : createdAt,
    listService,
    listMaterial,
    observation,
    createdAt
  ];

  const queryOperations = `
  INSERT INTO tbl_operations_logs (
    protocol, 
    employee_id, 
    admin_id,
    client_name, 
    city, 
    classification, 
    nomenclature, 
    address, 
    status, 
    update_count, 
    created_at, 
    modification_at, 
    list_service, 
    list_material,
    observation,  
    finished_at
) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
return { query: queryOperations, values: values };
}