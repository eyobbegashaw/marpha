import { db } from '../../database/connection';
import { NotFoundError } from '../../common/errors';

export class ManufacturersService {
  async listManufacturers(organizationId: string) {
    const res = await db.query('SELECT * FROM manufacturers WHERE organization_id = $1 ORDER BY name ASC', [organizationId]);
    return res.rows;
  }

  async getManufacturerById(organizationId: string, id: string) {
    const res = await db.query('SELECT * FROM manufacturers WHERE organization_id = $1 AND id = $2', [organizationId, id]);
    if (res.rows.length === 0) throw new NotFoundError('Manufacturer not found');
    return res.rows[0];
  }

  async createManufacturer(organizationId: string, data: { name: string; country?: string; contact_email?: string; contact_phone?: string }) {
    const res = await db.query(
      `INSERT INTO manufacturers (organization_id, name, country, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organizationId, data.name, data.country || null, data.contact_email || null, data.contact_phone || null]
    );
    return res.rows[0];
  }

  async updateManufacturer(organizationId: string, id: string, data: { name?: string; country?: string; contact_email?: string; contact_phone?: string; is_active?: boolean }) {
    const res = await db.query(
      `UPDATE manufacturers
       SET name = COALESCE($1, name),
           country = COALESCE($2, country),
           contact_email = COALESCE($3, contact_email),
           contact_phone = COALESCE($4, contact_phone),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $6 AND id = $7
       RETURNING *`,
      [data.name, data.country, data.contact_email, data.contact_phone, data.is_active, organizationId, id]
    );
    if (res.rows.length === 0) throw new NotFoundError('Manufacturer not found');
    return res.rows[0];
  }
}

export const manufacturersService = new ManufacturersService();
