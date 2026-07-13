import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

export class AuthService {
  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    // Case-insensitive email match (emails stored mixed-case in some seeds)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      throw {
        status: 401,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      };
    }

    if (!user.isActive) {
      throw {
        status: 403,
        error: 'Account inactive',
        message: 'Your account has been deactivated'
      };
    }

    if (!user.tenant.isActive) {
      throw {
        status: 403,
        error: 'Tenant inactive',
        message: 'Your organization account has been deactivated'
      };
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw {
        status: 401,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      };
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name
        }
      }
    };
  }

  async register(input: RegisterInput) {
    let tenantId: string;
    let tenant: { id: string; name: string; isActive: boolean } | null = null;

    if (input.createTenant && input.tenantName && input.tenantEmail) {
      const tags: string[] = [];
      if (input.businessType) {
        tags.push(input.businessType);
      }

      const newTenant = await prisma.tenant.create({
        data: {
          name: input.tenantName,
          email: input.tenantEmail,
          phone: input.tenantPhone || input.phone || null,
          address: input.tenantAddress || null,
          city: input.tenantCity || null,
          category: input.tenantCategory || null,
          tags,
          isActive: true
        }
      });

      const onboardingData = {
        businessType: input.businessType || null,
        hasCommercialLocal: input.hasCommercialLocal || null,
        onboardingCompleted: true,
        onboardingDate: new Date().toISOString()
      };

      await prisma.tenantSettings.create({
        data: {
          tenantId: newTenant.id,
          timezone: 'Africa/Casablanca',
          currency: 'EUR',
          language: 'fr',
          bookingAdvanceDays: 30,
          cancellationHours: 24,
          description: JSON.stringify(onboardingData)
        }
      });

      tenantId = newTenant.id;
      tenant = {
        id: newTenant.id,
        name: newTenant.name,
        isActive: newTenant.isActive
      };

      console.log(`[Register] ✅ Auto-generated tenant ID: ${tenantId} for organization: ${input.tenantName}`);
    } else if (input.tenantId) {
      tenantId = input.tenantId;

      tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, isActive: true }
      });

      if (!tenant) {
        throw {
          status: 404,
          error: 'Tenant not found',
          message: 'The specified organization does not exist. Please verify the tenant ID or contact support.'
        };
      }

      if (!tenant.isActive) {
        throw {
          status: 403,
          error: 'Tenant inactive',
          message: 'This organization account has been deactivated. Please contact support.'
        };
      }
    } else {
      throw {
        status: 400,
        error: 'Tenant required',
        message: 'Registration requires either: (1) an existing tenant ID, or (2) create a new organization by providing tenantName and tenantEmail with createTenant=true.'
      };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        tenantId: tenantId
      }
    });

    if (existingUser) {
      throw {
        status: 409,
        error: 'User exists',
        message: 'A user with this email already exists in this organization'
      };
    }

    const hashedPassword = await hashPassword(input.password);
    const userRole = input.createTenant ? 'ADMIN' : 'STAFF';

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        tenantId: tenantId,
        role: userRole
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name
        }
      }
    };
  }

  async getCurrentUser(userId: string) {
    console.log('[Auth Service /me] Fetching user:', userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      console.error('[Auth Service /me] User not found for userId:', userId);
      throw {
        status: 404,
        error: 'User not found'
      };
    }

    let tenant = null;
    try {
      tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          logo: true
        }
      });
    } catch (tenantError: any) {
      console.error('[Auth Service /me] Error fetching tenant:', tenantError);
    }

    if (!tenant) {
      console.error('[Auth Service /me] User tenant not found for tenantId:', user.tenantId);
      throw {
        status: 500,
        error: 'Invalid user data',
        message: 'User tenant information is missing. Please contact support.'
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant
      }
    };
  }

  async handleGoogleCallback(googleUser: any, frontendUrl: string) {
    const { email, given_name, family_name, picture } = googleUser;

    if (!email) {
      throw {
        status: 400,
        error: 'No email',
        message: 'Google account must have an email'
      };
    }

    console.log('[Auth Service Google] Searching for user with email:', email.toLowerCase());
    let user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase()
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    console.log('[Auth Service Google] User lookup result:', { found: !!user, userId: user?.id });

    if (!user) {
      throw {
        status: 404,
        error: 'User not found',
        email,
        message: 'Compte non trouvé. Veuillez créer un compte d\'abord.'
      };
    }

    if (!user.isActive) {
      throw {
        status: 403,
        error: 'Account inactive',
        message: 'User account is inactive'
      };
    }

    if (!user.tenant?.isActive) {
      throw {
        status: 403,
        error: 'Tenant inactive',
        message: 'Tenant account is inactive'
      };
    }

    if (picture && !user.avatar) {
      console.log('[Auth Service Google] Updating user avatar');
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: picture }
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    });

    return {
      token,
      frontendUrl,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name
        }
      }
    };
  }

  getGoogleRedirectUri() {
    let redirectUri: string;

    if (process.env.GOOGLE_REDIRECT_URI_SAAS) {
      redirectUri = process.env.GOOGLE_REDIRECT_URI_SAAS;
    } else if (process.env.SAAS_URL) {
      redirectUri = `${process.env.SAAS_URL}/auth/google/callback`;
    } else {
      redirectUri = 'https://pro.wellbe.ma/auth/google/callback';
    }

    redirectUri = redirectUri.trim().replace(/\/$/, '');

    console.log('[Auth Service Google] getGoogleRedirectUri result:', {
      normalized: redirectUri,
      length: redirectUri.length
    });

    return redirectUri;
  }

  getBackendUrl() {
    return process.env.BACKEND_URL || 'https://api.wellbe.ma';
  }

  getSaasUrl() {
    return process.env.SAAS_URL || 'https://pro.wellbe.ma';
  }
}

export const authService = new AuthService();
