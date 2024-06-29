import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT),
  connectionLimit: 10,
  ...(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === 'true' && {
    ssl: {
      ca: fs.readFileSync(__dirname + '/certs/ca-cert.pem'),
    },
  }),
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

export async function executeTransaction(queries: Array<{ query: string, values?: any[] }>): Promise<void> {
  let connection: PoolConnection | null = null;
  try {
    connection = await dbPool.getConnection();
    await connection.beginTransaction();

    for (const { query, values } of queries) {
      await connection.query(query, values);
    }

    await connection.commit();
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw new Error(`Erro durante a transação: ${error}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
