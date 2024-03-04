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


interface InsertItem {
  product_name: string;
  unit_type: string;
  product_code: string;
  product_batch?: string | null;
  quantity_value: string;
  created_at: string;
}

interface PropsTypes {
  insert: InsertItem[],
  employeeId: number,
  transferType: string
}

export async function material_transfer({ insert, employeeId, transferType }: PropsTypes) {
  function generatePlaceholders(count: number) {
    let valueQuery = '';
    const placeholders = Array(count).fill('?').join(', ');

    for (let i = 0; i < insert.length; i++) {
      const valueSql = `(${placeholders})`;
      valueQuery += valueSql;
      if (i < insert.length - 1) {
        valueQuery += ', ';
      }
    }
    return valueQuery;
  }

  const createdAt = getCurrentDateTime();

  const insertValueMaterialsEmployee: Array<number | string | null> = [];
  insert.forEach(item => {
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
}
