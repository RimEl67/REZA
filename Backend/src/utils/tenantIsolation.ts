/**
 * TENANT ISOLATION UTILITIES
 * 
 * CRITICAL: tenantId is the foundation of data isolation in this multi-tenant system.
 * Every query MUST include tenantId to ensure tenants cannot access each other's data.
 * 
 * Security Principle: Row-Level Security (RLS) through application-level filtering
 */

import { Request } from 'express';

/**
 * Ensures tenantId is present in the request
 * Throws error if tenantId is missing or invalid
 */
export function requireTenantId(req: Request): string {
  const tenantId = req.tenantId;

  if (!tenantId) {
    throw new Error('SECURITY: tenantId is required but missing from request');
  }

  // SECURITY: Reject 'default' as it breaks data isolation
  if (tenantId === 'default') {
    throw new Error('SECURITY: tenantId="default" is not allowed. This breaks data isolation.');
  }

  return tenantId;
}

/**
 * Creates a tenant-scoped where clause
 * Use this for all queries to ensure tenant isolation
 */
export function tenantWhere(req: Request, additionalWhere: any = {}) {
  const tenantId = requireTenantId(req);
  
  return {
    tenantId,
    ...additionalWhere
  };
}

/**
 * Verifies that a record belongs to the tenant before operations
 * Use this before update/delete operations
 */
export async function verifyTenantOwnership<T extends { tenantId: string }>(
  prisma: any,
  model: string,
  recordId: string,
  tenantId: string
): Promise<T | null> {
  const record = await prisma[model].findFirst({
    where: {
      id: recordId,
      tenantId: tenantId
    }
  });

  if (!record) {
    return null;
  }

  // Double-check tenantId matches
  if (record.tenantId !== tenantId) {
    throw new Error(`SECURITY: Record belongs to different tenant. Expected: ${tenantId}, Found: ${record.tenantId}`);
  }

  return record as T;
}

/**
 * Ensures tenantId is included in create data
 * Throws error if tenantId is missing or invalid
 */
export function ensureTenantInData(req: Request, data: any): any {
  const tenantId = requireTenantId(req);
  
  return {
    ...data,
    tenantId // Always override to ensure correct tenantId
  };
}

/**
 * Validates tenantId format (should be a valid CUID or custom ID, not 'default')
 */
export function isValidTenantId(tenantId: string | undefined | null): boolean {
  if (!tenantId) {
    return false;
  }

  // Reject 'default' and empty strings
  if (tenantId === 'default' || tenantId.trim() === '') {
    return false;
  }

  // Basic validation: should be a non-empty string
  return typeof tenantId === 'string' && tenantId.length > 0;
}

/**
 * Middleware helper to validate tenantId before route handlers
 * Use this in routes that absolutely require tenantId
 */
export function validateTenantId(req: Request, res: any, next: any) {
  try {
    requireTenantId(req);
    next();
  } catch (error: any) {
    return res.status(403).json({
      error: 'Tenant validation failed',
      message: error.message || 'Invalid tenant ID'
    });
  }
}
