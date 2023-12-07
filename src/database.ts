import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const mysqlSsl= JSON.parse(String(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED));

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: 'apps',
  port: 3306,
  connectionLimit: 10,
  ssl: mysqlSsl ? {
   rejectUnauthorized: true
  } : {}
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
INSERT INTO `exa_users` (`name`, `role`, `identification`, `password`, `created_at`)
VALUES
('James Junio', 'admin', '46.557.719/0001-29', '$2a$10$LdGm2KobjPi3my8fhj73VOVQa7HO00UY7Fsp7KjdiTmsmq9oN7Jvm', NOW());

INSERT INTO `exa_users` (`name`, `role`, `identification`, `password`, `created_at`)
VALUES
('Fabio Moraes', 'admin', '415.230.898-22', '$2a$12$WF.1omNnXZ/0DfgEFBjl.eAXYrYcQ6x/gPSMgrDc344dKO50HnDWe', NOW());
*/


//admin
//46.557.719/0001-29
//090807junio
 