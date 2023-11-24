import mysql, { Pool, PoolConnection } from 'mysql2/promise';

const dbConfig = {
  host: 'aws.connect.psdb.cloud',
  user: 'nbwp6r51iwjr2wxmxdjl',
  password: 'pscale_pw_Qss1rPEAumkslT9aSw06rVaOoVHAYQRBp17Iru8sO5b',
  database: 'apps',
  port: 3306,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: true
  }
};

const dbPool: Pool = mysql.createPool(dbConfig);

process.on('beforeExit', () => {
  dbPool.end();
});

export async function executeQuery(query: string, values?: any[]): Promise<any[]> {
  let connection: PoolConnection | null = null;
  try {
    connection = await dbPool.getConnection();
    const [results] = await connection.query(query, values);
    return results as any[];
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

/* 
CREATE TABLE `exa_operations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `admin_id` int,
  `client_name` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `classification` varchar(50) NOT NULL,
  `nomenclature` varchar(100) NOT NULL,
  `address` varchar(255) NOT NULL,
  `protocol` varchar(30) NOT NULL,
  `status` varchar(50) NOT NULL,
  `update_count` int NOT NULL,
  `used_service_id` varchar(255),
  `used_material_id` varchar(255),
  `observation` varchar(1000),
  `created_at` timestamp NULL,
  `modification_at` timestamp NULL,
  `finished_at` timestamp NULL,
  PRIMARY KEY (`id`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;
*/

/* 
CREATE TABLE `exa_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `team` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` varchar(30) NOT NULL,
  `identification` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL,
  PRIMARY KEY (`id`)
) ENGINE InnoDB,
  CHARSET utf8mb4,
  COLLATE utf8mb4_0900_ai_ci;
*/

/* 
INSERT INTO `exa_users` (`team`, `name`, `role`, `identification`, `password`, `created_at`)
VALUES
(1, 'James Junio', 'admin', '46.557.719/0001-29', '$2a$10$sA6cfgM7gf/41JF53Tn.6eg6RbfAsCbWV7ph1Sf4TAcG4atyIQ9.W', NOW())
*/


//admin
//46.557.719/0001-29
//090807junio
 