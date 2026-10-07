import { Request, Response, NextFunction } from 'express';
import { platformService } from './platform.service';
import { ApiResponse } from '../../common/utils/apiResponse';
import { logAuditEvent } from '../../common/middlewares/auditLoggerMiddleware';

export class PlatformController {
  async listPharmacies(req: Request, res: Response, next: NextFunction) {
    try {
      const pharmacies = await platformService.listPharmacies();
      return ApiResponse.success(res, pharmacies, 'Pharmacy tenants retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createPharmacy(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await platformService.createPharmacy(req.body);
      await logAuditEvent(
        req,
        'CREATE_PHARMACY_TENANT',
        'organizations',
        result.organization.id,
        { code: result.organization.code, name: result.organization.name }
      );
      return ApiResponse.created(res, result, `Pharmacy tenant '${result.organization.name}' onboarded successfully`);
    } catch (error) {
      next(error);
    }
  }

  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const config = await platformService.getPharmacyConfiguration(orgId);
      return ApiResponse.success(res, config, 'Tenant configuration retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateBranding(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const updated = await platformService.updateBranding(orgId, req.body);
      await logAuditEvent(
        req,
        'UPDATE_TENANT_BRANDING',
        'tenant_configurations',
        updated.id,
        { organizationId: orgId, changes: req.body }
      );
      return ApiResponse.success(res, updated, 'Tenant branding updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const updated = await platformService.updateContent(orgId, req.body.content);
      await logAuditEvent(
        req,
        'UPDATE_TENANT_CONTENT',
        'tenant_configurations',
        updated.id,
        { organizationId: orgId, updatedKeys: Object.keys(req.body.content) }
      );
      return ApiResponse.success(res, updated, 'Tenant content configuration updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const updated = await platformService.updateSettings(orgId, req.body);
      await logAuditEvent(
        req,
        'UPDATE_TENANT_SETTINGS',
        'tenant_configurations',
        updated.id,
        { organizationId: orgId, changes: req.body }
      );
      return ApiResponse.success(res, updated, 'Tenant application settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateFeatures(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const updated = await platformService.updateFeatures(orgId, req.body);
      await logAuditEvent(
        req,
        'UPDATE_TENANT_FEATURES',
        'tenant_configurations',
        updated.id,
        { organizationId: orgId, featureFlags: req.body }
      );
      return ApiResponse.success(res, updated, 'Tenant feature toggles updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async previewConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = req.params.id;
      const current = await platformService.getPharmacyConfiguration(orgId);
      const overrides = req.body;

      const preview = {
        ...current,
        pharmacy_name: overrides.pharmacyName || overrides.pharmacy_name || current.pharmacy_name,
        display_name: overrides.displayName || overrides.display_name || current.display_name,
        welcome_message: overrides.welcomeMessage || overrides.welcome_message || current.welcome_message,
        footer_text: overrides.footerText || overrides.footer_text || current.footer_text,
        primary_color: overrides.primaryColor || overrides.primary_color || current.primary_color,
        secondary_color: overrides.secondaryColor || overrides.secondary_color || current.secondary_color,
        accent_color: overrides.accentColor || overrides.accent_color || current.accent_color,
        background_color: overrides.backgroundColor || overrides.background_color || current.background_color,
        text_color: overrides.textColor || overrides.text_color || current.text_color,
        branding: {
          primaryColor: overrides.primaryColor || overrides.primary_color || current.primary_color,
          secondaryColor: overrides.secondaryColor || overrides.secondary_color || current.secondary_color,
          accentColor: overrides.accentColor || overrides.accent_color || current.accent_color,
          backgroundColor: overrides.backgroundColor || overrides.background_color || current.background_color,
          textColor: overrides.textColor || overrides.text_color || current.text_color,
          logoUrl: overrides.logoUrl !== undefined ? overrides.logoUrl : current.logo_url,
          faviconUrl: overrides.faviconUrl !== undefined ? overrides.faviconUrl : current.favicon_url,
        },
        content: {
          ...current.content,
          ...(overrides.content || {}),
        },
        feature_flags: {
          ...current.feature_flags,
          ...(overrides.feature_flags || {}),
        },
        settings: {
          ...current.settings,
          ...(overrides.settings || {}),
        },
      };

      return ApiResponse.success(res, preview, 'Configuration preview generated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPublicConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantHeader = (req.headers['x-tenant-id'] || req.headers['x-organization-code']) as string | undefined;
      const tenantQuery = (req.query.tenantCode || req.query.tenantId || req.query.orgCode) as string | undefined;
      const userOrgId = req.user?.organization_id;

      const resolvedIdentifier = tenantHeader || tenantQuery || userOrgId || undefined;
      const config = await platformService.getPublicConfiguration(resolvedIdentifier);

      return ApiResponse.success(res, config, 'Public tenant configuration bootstrapped successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const platformController = new PlatformController();
