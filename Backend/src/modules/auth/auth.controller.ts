import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.errors[0].message
        });
      }
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => {
          if (err.path.includes('tenantId')) {
            return 'Tenant ID is required. If you are creating a new organization, please use the organization creation flow.';
          }
          return `${err.path.join('.')}: ${err.message}`;
        });
        return res.status(400).json({
          error: 'Validation error',
          message: errorMessages.join(', '),
          details: error.errors
        });
      }
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[Auth Controller /me] Request received, userId:', req.userId);

      if (!req.userId) {
        console.error('[Auth Controller /me] No userId in request');
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request'
        });
      }

      const result = await authService.getCurrentUser(req.userId, req.tenantId);
      res.json(result);
    } catch (error: any) {
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      console.error('[Auth Controller /me] Error:', error);
      next(error);
    }
  }

  getGoogleUrl(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[Auth Controller Google] URL request received');
      const clientId = process.env.GOOGLE_CLIENT_ID;

      const frontendUrl = (req.query.frontend_url as string | undefined) || process.env.SAAS_URL || 'https://pro.wellbe.ma';
      const frontendUrlNormalized = frontendUrl.trim().replace(/\/$/, '');

      const backendUrl = authService.getBackendUrl();
      const backendCallbackUrl = `${backendUrl}/api/auth/google/callback`;

      console.log('[Auth Controller Google] Configuration check:', {
        hasClientId: !!clientId,
        frontendUrl: frontendUrlNormalized,
        backendCallbackUrl: backendCallbackUrl
      });

      if (!clientId) {
        console.error('[Auth Controller Google] GOOGLE_CLIENT_ID is not set');
        return res.status(500).json({
          error: 'Google OAuth not configured',
          message: 'Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID in environment variables.'
        });
      }

      const scopes = ['openid', 'profile', 'email'].join(' ');
      const stateData = {
        random: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        frontendUrl: frontendUrlNormalized
      };
      const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(backendCallbackUrl)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${encodeURIComponent(state)}&` +
        `access_type=offline&` +
        `prompt=consent`;

      console.log('[Auth Controller Google] Generated auth URL');
      console.log('[Auth Controller Google] ⚠️ Redirect URI (backend callback):', backendCallbackUrl);
      console.log('[Auth Controller Google] ⚠️ Add this to Google Cloud Console:', backendCallbackUrl);

      res.json({ url: authUrl, state });
    } catch (error: any) {
      console.error('[Auth Controller Google] Error generating URL:', error);
      next(error);
    }
  }

  async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('[Auth Controller Google] Callback received');
      const { code, state, error } = req.query;

      if (error) {
        console.error('[Auth Controller Google] Error from Google:', error);
        const frontendUrl = authService.getSaasUrl();
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&details=${encodeURIComponent(error as string)}`);
      }

      if (!code) {
        console.error('[Auth Controller Google] No code received');
        const frontendUrl = authService.getSaasUrl();
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&details=no_code`);
      }

      console.log('[Auth Controller Google] Code received, exchanging for token...');

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      let frontendUrl: string;
      try {
        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
        frontendUrl = stateData.frontendUrl;
        console.log('[Auth Controller Google] Retrieved frontend URL from state:', frontendUrl);
      } catch (e) {
        frontendUrl = authService.getSaasUrl();
        console.log('[Auth Controller Google] Using default frontend URL:', frontendUrl);
      }

      const backendUrl = authService.getBackendUrl();
      const redirectUri = `${backendUrl}/api/auth/google/callback`;

      if (!clientId || !clientSecret) {
        console.error('[Auth Controller Google] Missing credentials');
        return res.redirect(`${frontendUrl}/login?error=google_auth_not_configured`);
      }

      const tokenRequestBody = new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenRequestBody
      });

      console.log('[Auth Controller Google] Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text().catch(() => 'Unknown error');
        console.error('[Auth Controller Google] Token exchange error:', errorText);
        const errorDescription = tokenResponse.statusText || 'Token exchange failed';
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&details=${encodeURIComponent(errorDescription)}&status=${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json() as { access_token?: string };
      const { access_token } = tokenData;
      console.log('[Auth Controller Google] Token received');

      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });

      console.log('[Auth Controller Google] User info response status:', userInfoResponse.status);

      if (!userInfoResponse.ok) {
        console.error('[Auth Controller Google] User info fetch error');
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed&details=user_info_failed&status=${userInfoResponse.status}`);
      }

      const googleUser = await userInfoResponse.json() as { email?: string; given_name?: string; family_name?: string; picture?: string; [key: string]: any };

      try {
        const result = await authService.handleGoogleCallback(googleUser, frontendUrl);
        const redirectUrl = `${result.frontendUrl}/auth/google/callback?token=${encodeURIComponent(result.token)}`;
        console.log('[Auth Controller Google] Redirecting with token');
        res.redirect(redirectUrl);
      } catch (serviceError: any) {
        if (serviceError.error === 'User not found') {
          return res.redirect(`${frontendUrl}/login?email=${encodeURIComponent(googleUser.email)}&error=google_user_not_found&message=Compte non trouvé. Veuillez créer un compte d'abord.`);
        }
        if (serviceError.status === 403) {
          return res.redirect(`${frontendUrl}/login?error=${serviceError.error}`);
        }
        throw serviceError;
      }
    } catch (error: any) {
      console.error('[Auth Controller Google] Unexpected error:', error);
      res.redirect(`${authService.getSaasUrl()}/login?error=google_auth_failed&details=unexpected_error`);
    }
  }

  async switchSalon(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ tenantId: z.string().min(1) });
      const { tenantId } = schema.parse(req.body);
      const result = await authService.switchSalon(req.userId!, tenantId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: error.errors[0].message
        });
      }
      if (error.status) {
        return res.status(error.status).json({ error: error.error, message: error.message });
      }
      next(error);
    }
  }

  logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
