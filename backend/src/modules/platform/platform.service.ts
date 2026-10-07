import { db } from '../../database/connection';
import { NotFoundError, ConflictError } from '../../common/errors';

export class PlatformService {
  async listPharmacies() {
    const res = await db.query(
      `SELECT o.id, o.name, o.code, o.phone, o.email, o.address, o.currency, o.is_active, o.created_at,
              COUNT(DISTINCT b.id) AS branch_count,
              tc.primary_color, tc.secondary_color, tc.logo_url, tc.display_name
       FROM organizations o
       LEFT JOIN branches b ON o.id = b.organization_id
       LEFT JOIN tenant_configurations tc ON o.id = tc.organization_id
       GROUP BY o.id, tc.primary_color, tc.secondary_color, tc.logo_url, tc.display_name
       ORDER BY o.created_at DESC`
    );
    return res.rows;
  }

  async createPharmacy(data: {
    name: string;
    code: string;
    taxId?: string;
    phone?: string;
    email?: string;
    address?: string;
    currency?: string;
    mainBranchName?: string;
    mainBranchCode?: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      logoUrl?: string | null;
      faviconUrl?: string | null;
      welcomeMessage?: string;
      footerText?: string;
    };
  }) {
    return await db.withTransaction(async (client) => {
      // 1. Check code uniqueness
      const existingOrg = await client.query('SELECT id FROM organizations WHERE code = $1', [data.code.toUpperCase()]);
      if (existingOrg.rows.length > 0) {
        throw new ConflictError(`Pharmacy with code '${data.code.toUpperCase()}' already exists`);
      }

      // 2. Insert Organization
      const orgRes = await client.query(
        `INSERT INTO organizations (name, code, tax_id, phone, email, address, currency, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING *`,
        [
          data.name,
          data.code.toUpperCase(),
          data.taxId || null,
          data.phone || null,
          data.email || null,
          data.address || null,
          data.currency || 'ETB',
        ]
      );
      const org = orgRes.rows[0];

      // 3. Insert Main Branch
      const branchRes = await client.query(
        `INSERT INTO branches (organization_id, name, code, phone, email, address, is_main, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, TRUE)
         RETURNING *`,
        [
          org.id,
          data.mainBranchName || 'Main Branch',
          (data.mainBranchCode || 'MAIN').toUpperCase(),
          data.phone || null,
          data.email || null,
          data.address || null,
        ]
      );
      const branch = branchRes.rows[0];

      // 4. Insert Default Physical Locations (Sales Shelf & Warehouse)
      await client.query(
        `INSERT INTO locations (organization_id, branch_id, name, code, location_type, is_sales_point, description)
         VALUES
         ($1, $2, 'Sales Shelf 01', 'SHELF-01', 'SALES_SHELF', TRUE, 'Customer-facing sales shelf'),
         ($1, $2, 'Main Warehouse', 'WH-01', 'WAREHOUSE', FALSE, 'Reserve storage stock')`,
        [org.id, branch.id]
      );

      // 5. Insert Tenant Configuration
      const branding = data.branding || {};
      const tcRes = await client.query(
        `INSERT INTO tenant_configurations (
          organization_id, pharmacy_name, display_name, logo_url, favicon_url,
          primary_color, secondary_color, accent_color, welcome_message, footer_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          org.id,
          data.name,
          data.name,
          branding.logoUrl || null,
          branding.faviconUrl || null,
          branding.primaryColor || '#0D9488',
          branding.secondaryColor || '#0F766E',
          branding.accentColor || '#F59E0B',
          branding.welcomeMessage || `Welcome to ${data.name}.`,
          branding.footerText || `© 2026 ${data.name}. All rights reserved.`,
        ]
      );

      return {
        organization: org,
        mainBranch: branch,
        configuration: tcRes.rows[0],
      };
    });
  }

  async getPharmacyConfiguration(organizationId: string) {
    const res = await db.query(
      `SELECT tc.*, o.name AS organization_name, o.code AS organization_code, o.is_active AS organization_active
       FROM tenant_configurations tc
       JOIN organizations o ON tc.organization_id = o.id
       WHERE tc.organization_id = $1`,
      [organizationId]
    );

    if (res.rows.length === 0) {
      // If tenant config doesn't exist yet for existing org, initialize default
      const orgRes = await db.query('SELECT * FROM organizations WHERE id = $1', [organizationId]);
      if (orgRes.rows.length === 0) {
        throw new NotFoundError('Pharmacy organization not found');
      }
      const org = orgRes.rows[0];

      const inserted = await db.query(
        `INSERT INTO tenant_configurations (organization_id, pharmacy_name, display_name)
         VALUES ($1, $2, $2)
         RETURNING *`,
        [org.id, org.name]
      );
      return {
        ...inserted.rows[0],
        organization_name: org.name,
        organization_code: org.code,
        organization_active: org.is_active,
      };
    }

    return res.rows[0];
  }

  async updateBranding(organizationId: string, data: any) {
    return await db.withTransaction(async (client) => {
      // Ensure configuration exists
      await this.getPharmacyConfiguration(organizationId);

      const res = await client.query(
        `UPDATE tenant_configurations
         SET pharmacy_name = COALESCE($1, pharmacy_name),
             display_name = COALESCE($2, display_name),
             logo_url = COALESCE($3, logo_url),
             favicon_url = COALESCE($4, favicon_url),
             primary_color = COALESCE($5, primary_color),
             secondary_color = COALESCE($6, secondary_color),
             accent_color = COALESCE($7, accent_color),
             background_color = COALESCE($8, background_color),
             text_color = COALESCE($9, text_color),
             login_page_branding = CASE WHEN $10::jsonb IS NOT NULL THEN login_page_branding || $10::jsonb ELSE login_page_branding END,
             dashboard_branding = CASE WHEN $11::jsonb IS NOT NULL THEN dashboard_branding || $11::jsonb ELSE dashboard_branding END,
             footer_text = COALESCE($12, footer_text),
             description = COALESCE($13, description),
             contact_email = COALESCE($14, contact_email),
             contact_phone = COALESCE($15, contact_phone),
             address = COALESCE($16, address),
             website = COALESCE($17, website),
             welcome_message = COALESCE($18, welcome_message),
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $19
         RETURNING *`,
        [
          data.pharmacyName,
          data.displayName,
          data.logoUrl,
          data.faviconUrl,
          data.primaryColor,
          data.secondaryColor,
          data.accentColor,
          data.backgroundColor,
          data.textColor,
          data.loginPageBranding ? JSON.stringify(data.loginPageBranding) : null,
          data.dashboardBranding ? JSON.stringify(data.dashboardBranding) : null,
          data.footerText,
          data.description,
          data.contactEmail,
          data.contactPhone,
          data.address,
          data.website,
          data.welcomeMessage,
          organizationId,
        ]
      );

      return res.rows[0];
    });
  }

  async updateContent(organizationId: string, contentMap: Record<string, { en: string; am?: string }>) {
    return await db.withTransaction(async (client) => {
      await this.getPharmacyConfiguration(organizationId);

      const res = await client.query(
        `UPDATE tenant_configurations
         SET content = content || $1::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $2
         RETURNING *`,
        [JSON.stringify(contentMap), organizationId]
      );

      return res.rows[0];
    });
  }

  async updateSettings(organizationId: string, settingsData: any) {
    return await db.withTransaction(async (client) => {
      await this.getPharmacyConfiguration(organizationId);

      const res = await client.query(
        `UPDATE tenant_configurations
         SET settings = settings || $1::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $2
         RETURNING *`,
        [JSON.stringify(settingsData), organizationId]
      );

      return res.rows[0];
    });
  }

  async updateFeatures(organizationId: string, featuresData: Record<string, boolean>) {
    return await db.withTransaction(async (client) => {
      await this.getPharmacyConfiguration(organizationId);

      const res = await client.query(
        `UPDATE tenant_configurations
         SET feature_flags = feature_flags || $1::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $2
         RETURNING *`,
        [JSON.stringify(featuresData), organizationId]
      );

      return res.rows[0];
    });
  }

  async getPublicConfiguration(tenantIdentifier?: string) {
    let query = `
      SELECT tc.pharmacy_name, tc.display_name, tc.logo_url, tc.favicon_url,
             tc.primary_color, tc.secondary_color, tc.accent_color, tc.background_color, tc.text_color,
             tc.login_page_branding, tc.dashboard_branding, tc.footer_text, tc.description,
             tc.contact_email, tc.contact_phone, tc.address, tc.website, tc.welcome_message,
             tc.content, tc.feature_flags, tc.settings,
             o.id AS organization_id, o.name AS organization_name, o.code AS organization_code
      FROM tenant_configurations tc
      JOIN organizations o ON tc.organization_id = o.id
      WHERE o.is_active = TRUE
    `;
    const params: any[] = [];

    if (tenantIdentifier) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantIdentifier);
      if (isUuid) {
        params.push(tenantIdentifier);
        query += ` AND o.id = $1`;
      } else {
        const rawUpper = tenantIdentifier.toUpperCase();
        const cleanSlug = tenantIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '');
        const fuzzyLike = `%${tenantIdentifier.toLowerCase().replace(/[-_]/g, '%')}%`;
        params.push(rawUpper, fuzzyLike, cleanSlug);
        query += ` AND (
          o.code = $1
          OR LOWER(REGEXP_REPLACE(tc.pharmacy_name, '[^a-zA-Z0-9]', '', 'g')) = $3
          OR LOWER(REGEXP_REPLACE(tc.display_name, '[^a-zA-Z0-9]', '', 'g')) = $3
          OR LOWER(REGEXP_REPLACE(o.name, '[^a-zA-Z0-9]', '', 'g')) = $3
          OR LOWER(REGEXP_REPLACE(tc.pharmacy_name, '[^a-zA-Z0-9]', '', 'g')) LIKE '%' || $3 || '%'
          OR LOWER(REGEXP_REPLACE(o.name, '[^a-zA-Z0-9]', '', 'g')) LIKE '%' || $3 || '%'
          OR LOWER(tc.pharmacy_name) ILIKE $2
          OR LOWER(tc.display_name) ILIKE $2
          OR LOWER(o.name) ILIKE $2
          OR LOWER(o.code) = $3
        )
        ORDER BY 
          CASE 
            WHEN o.code = $1 THEN 1 
            WHEN LOWER(REGEXP_REPLACE(tc.pharmacy_name, '[^a-zA-Z0-9]', '', 'g')) = $3 THEN 2
            WHEN LOWER(REGEXP_REPLACE(tc.display_name, '[^a-zA-Z0-9]', '', 'g')) = $3 THEN 3
            ELSE 4 
          END,
          o.created_at ASC
        LIMIT 1`;
      }
    } else {
      // Default to first active pharmacy if no specific identifier passed
      query += ` ORDER BY o.created_at ASC LIMIT 1`;
    }

    const res = await db.query(query, params);
    if (res.rows.length === 0) {
      throw new NotFoundError('Tenant configuration not found for the requested pharmacy');
    }

    return res.rows[0];
  }
}

export const platformService = new PlatformService();
