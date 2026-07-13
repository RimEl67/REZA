import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export type AuthResult =
  | { ok: true }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * Verify Bearer JWT, load user, attach req.user / req.userId / req.tenantId.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      body: { error: 'Unauthorized', message: 'Authentication token required' }
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || !decoded.userId) {
    return {
      ok: false,
      status: 401,
      body: { error: 'Invalid token', message: 'The provided token is invalid or expired' }
    };
  }

  if (!decoded.tenantId) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'Invalid token',
        message: 'Token does not contain tenant information. Please log in again.'
      }
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true,
      isActive: true
    }
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      }
    };
  }

  if (!user.isActive) {
    return {
      ok: false,
      status: 403,
      body: { error: 'Account inactive', message: 'Your account has been deactivated' }
    };
  }

  const tokenTenantId = decoded.tenantId;
  if (tokenTenantId !== user.tenantId) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Tenant mismatch',
        message: 'User does not belong to the specified tenant',
      },
    };
  }

  const finalTenantId = user.tenantId;
  if (finalTenantId === 'default') {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Account update required',
        message: 'Your account needs to be updated. Please log out and log back in.'
      }
    };
  }

  req.userId = user.id;
  req.tenantId = finalTenantId;
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: finalTenantId
  };

  return { ok: true };
}

/** Stricter variant: user.tenantId must match token tenantId */
export async function authenticateRequestStrictTenant(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      body: { error: 'Unauthorized', message: 'Authentication token required' }
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'Invalid token',
        message: 'The provided token is invalid or expired. Please log in again.'
      }
    };
  }

  if (!decoded.tenantId) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'Invalid token',
        message: 'Token does not contain tenant information. Please log in again.'
      }
    };
  }

  if (!decoded.userId) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'Invalid token',
        message: 'Token does not contain user information. Please log in again.',
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true, tenantId: true, isActive: true }
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      }
    };
  }

  if (!user.isActive) {
    return {
      ok: false,
      status: 403,
      body: { error: 'Account inactive', message: 'Your account has been deactivated' }
    };
  }

  if (user.tenantId !== decoded.tenantId) {
    return {
      ok: false,
      status: 403,
      body: { error: 'Tenant mismatch', message: 'User does not belong to the specified tenant' }
    };
  }

  if (decoded.tenantId === 'default') {
    return {
      ok: false,
      status: 403,
      body: { error: 'Account update required', message: 'Invalid tenant configuration.' }
    };
  }

  req.userId = user.id;
  req.tenantId = user.tenantId;
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  };

  return { ok: true };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authenticateRequestStrictTenant(req);
    if (result.ok === false) {
      return res.status(result.status).json(result.body);
    }
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'An error occurred while verifying your authentication'
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    next();
  };
};
