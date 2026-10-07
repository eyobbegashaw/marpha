"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.rollbackMigrations = rollbackMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("./connection");
async function runMigrations() {
    console.log('🔄 Running database migrations...');
    const schemaPath = path_1.default.join(__dirname, 'schema.sql');
    const sql = fs_1.default.readFileSync(schemaPath, 'utf8');
    try {
        await connection_1.db.query(sql);
        console.log('✅ Database schema migrated successfully.');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}
async function rollbackMigrations() {
    console.log('🔄 Dropping all tables...');
    const dropSql = `
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS tenant_configurations CASCADE;
    DROP TABLE IF EXISTS notification_preferences CASCADE;
    DROP TABLE IF EXISTS notifications CASCADE;
    DROP TABLE IF EXISTS expenses CASCADE;
    DROP TABLE IF EXISTS sale_items CASCADE;
    DROP TABLE IF EXISTS sales CASCADE;
    DROP TABLE IF EXISTS prescription_items CASCADE;
    DROP TABLE IF EXISTS prescriptions CASCADE;
    DROP TABLE IF EXISTS customers CASCADE;
    DROP TABLE IF EXISTS purchase_items CASCADE;
    DROP TABLE IF EXISTS purchases CASCADE;
    DROP TABLE IF EXISTS inventory_transactions CASCADE;
    DROP TABLE IF EXISTS inventory CASCADE;
    DROP TABLE IF EXISTS product_batches CASCADE;
    DROP TABLE IF EXISTS product_price_history CASCADE;
    DROP TABLE IF EXISTS medical_information CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    DROP TABLE IF EXISTS suppliers CASCADE;
    DROP TABLE IF EXISTS manufacturers CASCADE;
    DROP TABLE IF EXISTS categories CASCADE;
    DROP TABLE IF EXISTS locations CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS role_permissions CASCADE;
    DROP TABLE IF EXISTS permissions CASCADE;
    DROP TABLE IF EXISTS roles CASCADE;
    DROP TABLE IF EXISTS branches CASCADE;
    DROP TABLE IF EXISTS organizations CASCADE;
  `;
    try {
        await connection_1.db.query(dropSql);
        console.log('✅ Database tables dropped.');
    }
    catch (error) {
        console.error('❌ Rollback failed:', error);
        throw error;
    }
}
if (process.argv[1] && process.argv[1].toLowerCase().includes('migrate')) {
    const isDown = process.argv.includes('down');
    (async () => {
        try {
            if (isDown) {
                await rollbackMigrations();
            }
            else {
                await runMigrations();
            }
            process.exit(0);
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
        finally {
            await connection_1.pool.end();
        }
    })();
}
//# sourceMappingURL=migrate.js.map