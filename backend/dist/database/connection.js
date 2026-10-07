"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
exports.pool = new pg_1.Pool({
    host: config_1.config.db.host,
    port: config_1.config.db.port,
    user: config_1.config.db.user,
    password: config_1.config.db.password,
    database: config_1.config.db.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});
exports.db = {
    query: async (text, params) => {
        const start = Date.now();
        try {
            const res = await exports.pool.query(text, params);
            const duration = Date.now() - start;
            if (config_1.config.env === 'development' && duration > 500) {
                console.warn(`[SLOW QUERY] ${duration}ms: ${text.substring(0, 100)}...`);
            }
            return res;
        }
        catch (error) {
            console.error('Database query error:', { text: text.substring(0, 200), error });
            throw error;
        }
    },
    withTransaction: async (callback) => {
        const client = await exports.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    },
    getClient: async () => {
        return await exports.pool.connect();
    },
    checkConnection: async () => {
        try {
            const res = await exports.pool.query('SELECT NOW()');
            return !!res.rows[0];
        }
        catch (err) {
            console.error('Failed to connect to PostgreSQL:', err);
            return false;
        }
    },
};
//# sourceMappingURL=connection.js.map