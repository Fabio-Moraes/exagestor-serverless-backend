import { executeQuery } from '../../config/database';

export async function increment_item(materials: string) {
  function generateQueryListMaterial(arr: string[]) {
    const placeholders = arr.map(() => '?').join(', ');
    return `SELECT * FROM tbl_stock_employee WHERE id IN (${placeholders})`;
  }
  
  function generatePlaceholders(data: Object[]) {
    const placeholders = data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    return placeholders;
  }
  
  const requestListMaterial = JSON.parse(materials);

  if (!requestListMaterial) {
    throw new Error('Lista de materiais não foi fornecida');
  }

  const listMaterialKeys = Object.keys(requestListMaterial);
  const queryListMaterial = generateQueryListMaterial(listMaterialKeys);
  const selectQueryListMaterial = await executeQuery(queryListMaterial, listMaterialKeys);

  const resultQueryListMaterial = selectQueryListMaterial.map(items => ({
    ...items,
    quantity_value: items.quantity_value - requestListMaterial[items.id]
  }));

  const updateValueMaterialsEmployee: Array<number | string | null> = [];

  resultQueryListMaterial.forEach(item => {
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
      quantity_value = quantity_value + VALUES(quantity_value),
      unit_type = VALUES(unit_type),
      created_at = VALUES(created_at);
    `;

  return { query: queryMaterialsEmployee, values: updateValueMaterialsEmployee };
}