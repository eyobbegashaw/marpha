import { db } from '../../database/connection';
import { NotFoundError } from '../../common/errors';

export class OrganizationsService {
  async getOrganization(orgId: string) {
    const res = await db.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
    if (res.rows.length === 0) throw new NotFoundError('Organization not found');
    return res.rows[0];
  }

  async updateOrganization(orgId: string, data: { name?: string; phone?: string; email?: string; address?: string; taxId?: string; currency?: string }) {
    const res = await db.query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           tax_id = COALESCE($5, tax_id),
           currency = COALESCE($6, currency),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [data.name, data.phone, data.email, data.address, data.taxId, data.currency, orgId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Organization not found');
    return res.rows[0];
  }

  async listBranches(orgId: string) {
    const res = await db.query('SELECT * FROM branches WHERE organization_id = $1 ORDER BY is_main DESC, name ASC', [orgId]);
    return res.rows;
  }

  async getBranch(orgId: string, branchId: string) {
    const res = await db.query('SELECT * FROM branches WHERE organization_id = $1 AND id = $2', [orgId, branchId]);
    if (res.rows.length === 0) throw new NotFoundError('Branch not found');
    return res.rows[0];
  }

  async createBranch(orgId: string, data: { name: string; code: string; phone?: string; email?: string; address?: string; city?: string }) {
    return await db.withTransaction(async (client) => {
      const res = await client.query(
        `INSERT INTO branches (organization_id, name, code, phone, email, address, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [orgId, data.name, data.code.toUpperCase(), data.phone, data.email, data.address, data.city]
      );
      const branch = res.rows[0];

      // Automatically create default Shelf and Warehouse for the new branch
      await client.query(
        `INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
         VALUES
         ($1, $2, $3, $4, 'SALES_SHELF', TRUE, 'Branch Sales Shelf for direct sales'),
         ($1, $2, $5, $6, 'WAREHOUSE', FALSE, 'Branch Warehouse for reserve storage')`,
        [
          orgId,
          branch.id,
          `${data.name} Sales Shelf`,
          `${data.code.toUpperCase()}-SHELF`,
          `${data.name} Warehouse`,
          `${data.code.toUpperCase()}-WH`,
        ]
      );

      return branch;
    });
  }

  async updateBranch(orgId: string, branchId: string, data: { name?: string; phone?: string; email?: string; address?: string; city?: string; isActive?: boolean }) {
    const res = await db.query(
      `UPDATE branches
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $7 AND id = $8
       RETURNING *`,
      [data.name, data.phone, data.email, data.address, data.city, data.isActive, orgId, branchId]
    );
    if (res.rows.length === 0) throw new NotFoundError('Branch not found');
    return res.rows[0];
  }
}

export const organizationsService = new OrganizationsService();
