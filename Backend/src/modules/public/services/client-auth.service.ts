import { prisma } from '../../../lib/prisma';
import { comparePassword, hashPassword } from '../../../utils/password';
import { fail } from '../utils/http';

const INVALID_CREDENTIALS_MSG = 'Email ou mot de passe incorrect.';

export class ClientAuthService {
  async registerClient(body: any) {
    try {
    const { email, firstName, lastName, phone, password } = body;

    if (!email || !firstName || !lastName) {
      fail(400, {
        error: 'Missing required fields',
        message: 'Email, first name, and last name are required.'
      });
    }

    if (!password || String(password).trim().length < 6) {
      fail(400, {
        error: 'Invalid password',
        message: 'Le mot de passe doit contenir au moins 6 caractères.'
      });
    }

    const hashedPassword = await hashPassword(String(password).trim());

    // Find or create a tenant for clients (use first active tenant or create default)
    let tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!tenant) {
      // Create default tenant for clients
      try {
        tenant = await prisma.tenant.create({
          data: {
            name: 'WellBe Platform',
            email: 'support@wellbe.com',
            isActive: true,
            category: 'Platform',
            shortDescription: 'Default tenant for client accounts'
          }
        });

        await prisma.tenantSettings.create({
          data: {
            tenantId: tenant.id,
            onlineReservationEnabled: true,
            showMap: true,
            showOpeningHours: true,
            showReviews: true
          }
        });
      } catch (tenantError: any) {
        // If creation fails, try to find it again
        tenant = await prisma.tenant.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: 'asc' }
        });

        if (!tenant) {
          fail(500, {
            error: 'System setup required',
            message: 'Unable to initialize the system. Please contact support.'
          });
        }
      }
    }

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        tenantId: tenant.id
      }
    });

    if (existingClient) {
      await prisma.client.update({
        where: { id: existingClient.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone || existingClient.phone,
          password: hashedPassword,
        },
      });

      return {
        client: {
          id: existingClient.id,
          email: existingClient.email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone || existingClient.phone,
          tenantId: existingClient.tenantId
        },
        message: 'Compte créé avec succès'
      };
    }

    // Create new client
    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone || '',
        password: hashedPassword,
        status: 'ACTIVE'
      }
    });

    return {
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        tenantId: client.tenantId
      },
      message: 'Compte créé avec succès'
    };
  } catch (error) {
    throw error;
  }
  }

  async loginClient(body: any) {
    try {
    const { email, password } = body;

    if (!email) {
      fail(400, {
        error: 'Email required',
        message: 'Please provide your email address.'
      });
    }

    if (!password) {
      fail(400, {
        error: 'Password required',
        message: INVALID_CREDENTIALS_MSG
      });
    }

    // Same email can exist per salon (booking) + platform account — use row with password
    const normalizedEmail = email.trim().toLowerCase();

    const candidates = await prisma.client.findMany({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
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

    const client = candidates.find((c) => c.password);

    if (!client) {
      fail(401, {
        error: 'Invalid credentials',
        message: INVALID_CREDENTIALS_MSG
      });
    }

    const passwordValid = await comparePassword(password, client.password!);
    if (!passwordValid) {
      fail(401, {
        error: 'Invalid credentials',
        message: INVALID_CREDENTIALS_MSG
      });
    }

    // Check if client is active
    if (client.status !== 'ACTIVE') {
      fail(401, {
        error: 'Invalid credentials',
        message: INVALID_CREDENTIALS_MSG
      });
    }

    // Return client data (without sensitive information)
    return {
      client: {
        id: client.id,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        tenantId: client.tenantId,
        tenant: client.tenant ? {
          id: client.tenant.id,
          name: client.tenant.name
        } : null
      },
      message: 'Connexion réussie'
    };
  } catch (error) {
    throw error;
  }
  }

  async getGoogleAuthUrl(query: Record<string, unknown>) {
    try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    // Get frontend URL from query parameter (where to redirect after auth)
    const frontendUrl = (query.frontend_url as string | undefined) || process.env.CLIENT_URL || 'https://my.wellbe.ma';
    const frontendUrlNormalized = frontendUrl.trim().replace(/\/$/, '');
    
    // The redirect_uri for Google OAuth must point to the BACKEND callback endpoint
    const backendUrl = process.env.BACKEND_URL || 'https://api.wellbe.ma';
    const backendCallbackUrl = `${backendUrl}/api/public/auth/google/callback`;
    
    console.log('[Google OAuth Client] Configuration:', {
      hasClientId: !!clientId,
      frontendUrl: frontendUrlNormalized,
      backendCallbackUrl: backendCallbackUrl,
      backendUrl: backendUrl
    });
    
    if (!clientId) {
      console.error('[Google OAuth Client] GOOGLE_CLIENT_ID is not set in environment variables');
      fail(500, {
        error: 'Google OAuth not configured',
        message: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in environment variables.'
      });
    }

    const scopes = ['openid', 'profile', 'email'].join(' ');
    // Store frontend URL in state so we can redirect there after auth
    const stateData = {
      random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      frontendUrl: frontendUrlNormalized
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Store state in session or return it to client to verify on callback
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(backendCallbackUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('[Google OAuth Client] Generated auth URL');
    console.log('[Google OAuth Client] ⚠️ Redirect URI (backend callback):', backendCallbackUrl);
    console.log('[Google OAuth Client] ⚠️ Frontend URL (where to redirect after):', frontendUrlNormalized);
    console.log('[Google OAuth Client] ⚠️ Backend callback URL MUST match EXACTLY with Google Cloud Console!');
    console.log('[Google OAuth Client] ⚠️ IMPORTANT: Add this redirect URI to Google Cloud Console:');
    console.log(`[Google OAuth Client] ⚠️   ${backendCallbackUrl}`);

    return {
      url: authUrl,
      state: state
    };
  } catch (error) {
    throw error;
  }
  }

  async handleGoogleCallback(
    query: Record<string, unknown>,
    headers: { host?: string; referer?: string; origin?: string }
  ) {
    try {
    console.log('[Google OAuth Client] Callback received');
    console.log('[Google OAuth Client] Request headers:', { 
      host: headers.host,
      referer: headers.referer,
      origin: headers.origin
    });
    
    const { code, state, error } = query;

    if (error) {
      console.error('[Google OAuth Client] Error from Google:', error);
      // Try to detect the origin from referer or use default
      const referer = headers.referer || '';
      const origin = referer.match(/^https?:\/\/[^\/]+/)?.[0] || process.env.CLIENT_URL || 'https://my.wellbe.ma';
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${origin}/login?error=google_auth_failed&details=${encodeURIComponent(error as string)}` });
    }

    if (!code) {
      console.error('[Google OAuth Client] No code received in callback');
      const referer = headers.referer || '';
      const origin = referer.match(/^https?:\/\/[^\/]+/)?.[0] || process.env.CLIENT_URL || 'https://my.wellbe.ma';
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${origin}/login?error=google_auth_failed&details=no_code` });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    // Decode the frontend URL from the state
    let frontendUrl: string;
    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      frontendUrl = stateData.frontendUrl;
      console.log('[Google OAuth Client] Retrieved frontend URL from state:', frontendUrl);
    } catch (e) {
      // Fallback to default if state parsing fails
      frontendUrl = process.env.CLIENT_URL || 'https://my.wellbe.ma';
      console.log('[Google OAuth Client] Failed to parse state, using default frontend URL:', frontendUrl);
    }
    
    // The redirect_uri for token exchange must be the BACKEND callback URL
    const backendUrl = process.env.BACKEND_URL || 'https://api.wellbe.ma';
    const redirectUri = `${backendUrl}/api/public/auth/google/callback`;
    
    console.log('[Google OAuth Client] Using redirect_uri for token exchange:', redirectUri);
    console.log('[Google OAuth Client] Frontend URL for final redirect:', frontendUrl);

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth Client] Missing credentials in production!', { hasClientId: !!clientId, hasClientSecret: !!clientSecret });
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${process.env.CLIENT_URL || 'https://my.wellbe.ma'}/login?error=google_auth_not_configured` });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Google token exchange error:', errorData);
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${process.env.CLIENT_URL || 'https://my.wellbe.ma'}/login?error=google_auth_failed` });
    }

    const tokenData = await tokenResponse.json() as { access_token?: string };
    const { access_token } = tokenData;

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${process.env.CLIENT_URL || 'https://my.wellbe.ma'}/login?error=google_auth_failed` });
    }

    const googleUser = await userInfoResponse.json() as {
      email?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };
    const { email, given_name, family_name, picture } = googleUser;

    if (!email) {
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${process.env.CLIENT_URL || 'https://my.wellbe.ma'}/login?error=google_auth_no_email` });
    }

    // Find or create tenant for clients
    let tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'WellBe Platform',
          email: 'support@wellbe.com',
          isActive: true,
          category: 'Platform',
          shortDescription: 'Default tenant for client accounts'
        }
      });

      await prisma.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          onlineReservationEnabled: true,
          showMap: true,
          showOpeningHours: true,
          showReviews: true
        }
      });
    }

    // Find or create client
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Google OAuth Client] Looking for client with email:', normalizedEmail, 'tenantId:', tenant.id);
    
    let client = await prisma.client.findFirst({
      where: {
        email: normalizedEmail,
        tenantId: tenant.id
      }
    });

    if (!client) {
      console.log('[Google OAuth Client] Client not found, creating new client');
      // Create new client
      client = await prisma.client.create({
        data: {
          email: normalizedEmail,
          firstName: given_name || email.split('@')[0],
          lastName: family_name || '',
          phone: '',
          tenantId: tenant.id,
          avatar: picture || null,
          status: 'ACTIVE'
        }
      });
      console.log('[Google OAuth Client] Client created:', { id: client.id, email: client.email });
    } else {
      console.log('[Google OAuth Client] Client found:', { id: client.id, email: client.email });
      // Update existing client with Google info if needed
      if (!client.avatar && picture) {
        await prisma.client.update({
          where: { id: client.id },
          data: { avatar: picture }
        });
      }
    }

    // Verify client exists before redirecting
    const verifyClient = await prisma.client.findFirst({
      where: {
        email: normalizedEmail
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!verifyClient) {
      console.error('[Google OAuth Client] ERROR: Client was created but cannot be found!');
      throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${frontendUrl}/login?error=google_auth_failed&details=client_creation_failed` });
    }

    console.log('[Google OAuth Client] Client verified, redirecting to frontend');
    // Redirect to frontend with success
    const redirectUrl = `${frontendUrl}/auth/google/callback?email=${encodeURIComponent(normalizedEmail)}&success=true`;
    console.log('[Google OAuth Client] Redirect URL:', redirectUrl);
    console.log('[Google OAuth Client] Frontend URL:', frontendUrl);
    throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: redirectUrl });
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    throw Object.assign(new Error("REDIRECT"), { isRedirect: true, url: `${process.env.CLIENT_URL || 'https://my.wellbe.ma'}/login?error=google_auth_failed` });
  }
  }

}

export const clientAuthService = new ClientAuthService();
