import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const db = {
  query: async <T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (config.env === 'development' && duration > 500) {
        console.warn(`[SLOW QUERY] ${duration}ms: ${text.substring(0, 100)}...`);
      }
      return res;
    } catch (error) {
      console.error('Database query error:', { text: text.substring(0, 200), error });
      throw error;
    }
  },

  withTransaction: async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getClient: async (): Promise<PoolClient> => {
    return await pool.connect();
  },

  checkConnection: async (): Promise<boolean> => {
    try {
      const res = await pool.query('SELECT NOW()');
      return !!res.rows[0];
    } catch (err) {
      console.error('Failed to connect to PostgreSQL:', err);
      return false;
    }
  },
};
