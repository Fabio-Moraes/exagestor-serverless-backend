interface ServiceData {
  id: number;
  client_name: string;
  employee_id: string;
  creator_leader_id: string;
  city: string;
  address: string;
  nomenclature: string;
  classification: string;
  status: string;
  update_count: number;
  start_service_at: string;
  created_at: string;
  modification_at: string;
  finished_at: string;
  list_material: string;
  list_service: string;
  observation: string;
  protocol: string;
}

interface TypeProps {
  row: ServiceData;
  newStatus: 'paused' | 'active' | 'analysis';
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

export async function update_state_modification(props: TypeProps) {
  const createdAt = getCurrentDateTime();

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

  return { query: queryOperations, values: values };
}