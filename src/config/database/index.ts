import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PORT,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_SSL_CA_CERT
} = process.env;

const dbConfig = {
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: Number(MYSQL_PORT),
  connectionLimit: 10,
  ...(MYSQL_SSL_CA_CERT && {
    ssl: { ca: MYSQL_SSL_CA_CERT },
  })
};

const dbPool: Pool = mysql.createPool(dbConfig);

process.on('beforeExit', () => {
  dbPool.end();
});

export async function executeQuery<T>(query: string, values?: T): Promise<object[]> {
  let connection: PoolConnection | null = null;
  try {
    connection = await dbPool.getConnection();
    const [results] = await connection.query(query, values);
    return results as any;
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

export async function executeTransaction<T>(queries: Array<{ query: string, values?: T }>): Promise<void> {
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
