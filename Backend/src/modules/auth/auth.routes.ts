import express from 'express';
import { authMiddleware } from '../../middleware/authenticateRequest';
import { authController } from './auth.controller';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', (req, res, next) => authController.login(req, res, next));

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', (req, res, next) => authController.register(req, res, next));

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req, res, next));

/**
 * GET /api/auth/google/url
 * Get Google OAuth URL
 */
router.get('/google/url', (req, res, next) => authController.getGoogleUrl(req, res, next));

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get('/google/callback', (req, res, next) => authController.handleGoogleCallback(req, res, next));

/**
 * POST /api/auth/logout
 * Logout
 */
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));

export default router;
