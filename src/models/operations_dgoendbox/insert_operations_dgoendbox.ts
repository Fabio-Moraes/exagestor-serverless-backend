type Dgoandbox = {
  dgoandbox_id: string;
  dgoandbox_name: string;
};

type OperationProps = {
  protocol: string;
  node_name: string;
};

type StructureDgoandbox = { [key: string]: { [key: string]: { [key: string]: string } } }

function parseObjectToInsertItems(structureDgoandbox: StructureDgoandbox): Dgoandbox[] {
  const insertItems: Dgoandbox[] = [];
  for (const dgoandbox_id in structureDgoandbox) {
    if (Object.prototype.hasOwnProperty.call(structureDgoandbox, dgoandbox_id)) {
      for (const dgoandbox_name in structureDgoandbox[dgoandbox_id]) {
        if (Object.prototype.hasOwnProperty.call(structureDgoandbox[dgoandbox_id], dgoandbox_name)) {
          insertItems.push({
            dgoandbox_id,
            dgoandbox_name: structureDgoandbox[dgoandbox_id][dgoandbox_name].value
          });
        }
      }
    }
  }
  return insertItems;
}

type PropsTypes = { structureDgoandbox: StructureDgoandbox, operationProps: OperationProps }

export async function insert_operations_dgoendbox(porps: PropsTypes) {
  const { structureDgoandbox: obj, operationProps } = porps;
  const insertItems = parseObjectToInsertItems(obj);

  if (!insertItems.length) {
    throw new Error('Nenhum item para inserir');
  }

  const insertValues: Array<string | number | null> = [];
  const placeholders: string[] = [];

  insertItems.forEach(item => {
    insertValues.push(
      operationProps.protocol,
      null,
      item.dgoandbox_name,
      item.dgoandbox_id,
      null,
      null,
      operationProps.node_name,
      null,
      null,
      null
    );
    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  });

  const queryDgoandboxOperations = `
    INSERT INTO tbl_dgoandbox_operations (
        protocol, 
        employee_id,
        dgoandbox_name,
        dgoandbox_id,
        latitude,
        longitude,
        node_name,
        address,
        observation, 
        created_at
    ) 
    VALUES ${placeholders.join(', ')};`;

  return { query: queryDgoandboxOperations, values: insertValues };
}