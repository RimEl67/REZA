import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { authMiddleware } from '../../middleware/authenticateRequest';
import { salonService } from './salon.service';

const router = express.Router();

const uploadsDir = path.resolve(__dirname, '..', '..', '..', 'public', 'uploads');
const salonsDir = path.join(uploadsDir, 'salons');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(salonsDir)) {
  fs.mkdirSync(salonsDir, { recursive: true });
}

const salonsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(salonsDir)) {
      fs.mkdirSync(salonsDir, { recursive: true });
    }
    cb(null, salonsDir);
  },
  filename: (req: any, file, cb) => {
    const uniqueSuffix = `${req.userId || 'salon'}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: salonsStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const latSchema = z.coerce
  .number({ invalid_type_error: 'Latitude invalide' })
  .min(-90, 'Latitude invalide')
  .max(90, 'Latitude invalide');
const lngSchema = z.coerce
  .number({ invalid_type_error: 'Longitude invalide' })
  .min(-180, 'Longitude invalide')
  .max(180, 'Longitude invalide');

const createSalonSchema = z.object({
  name: z.string().min(1, 'Le nom du salon est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Le téléphone est requis'),
  address: z.string().optional(),
  city: z.string().min(1, 'La ville est requise'),
  category: z.string().min(1, 'La catégorie est requise'),
  shortDescription: z.string().min(1, 'La description courte est requise').max(200, 'Description courte max 200 caractères'),
  latitude: latSchema,
  longitude: lngSchema,
});

const updateSalonSchema = z.object({
  name: z.string().min(1, 'Le nom du salon est requis').optional(),
  email: z.string().email('Email invalide').optional(),
  phone: z.string().min(1, 'Le téléphone est requis').optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'La ville est requise').optional(),
  category: z.string().min(1, 'La catégorie est requise').optional(),
  shortDescription: z
    .string()
    .min(1, 'La description courte est requise')
    .max(200, 'Description courte max 200 caractères')
    .optional(),
  latitude: latSchema.optional(),
  longitude: lngSchema.optional(),
}).refine(
  (data) =>
    (data.latitude === undefined && data.longitude === undefined) ||
    (data.latitude !== undefined && data.longitude !== undefined),
  { message: 'Latitude et longitude doivent être fournies ensemble', path: ['latitude'] }
);

function removeUploadedFile(file?: Express.Multer.File) {
  if (!file?.path) return;
  try {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  } catch {
    // ignore cleanup errors
  }
}

/**
 * GET /api/salons
 * List salons of the authenticated owner's account.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await salonService.listForOwner(req.userId!);
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/salons
 * Create a new salon (multipart: fields + coverImage file).
 * All client-visibility completeness fields required.
 */
router.post('/', authMiddleware, (req, res, next) => {
  upload.single('coverImage')(req, res, (err) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? (err.code === 'LIMIT_FILE_SIZE' ? 'Image trop volumineuse (max 5 Mo)' : err.message)
        : (err.message || 'Erreur upload image');
      return res.status(400).json({ error: 'Upload error', message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'L\'image de couverture est requise',
      });
    }

    const parsed = createSalonSchema.parse(req.body);
    const data: import('./salon.service').CreateSalonInput = {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      address: parsed.address,
      city: parsed.city,
      category: parsed.category,
      shortDescription: parsed.shortDescription,
      coverImage: `/uploads/salons/${req.file.filename}`,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };

    const result = await salonService.createForOwner(req.userId!, data);
    res.status(201).json(result);
  } catch (error: any) {
    removeUploadedFile(req.file);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

/**
 * PATCH /api/salons/:id
 * Update salon (multipart optional: replace coverImage).
 * Owner only. Completeness re-validated when public fields are touched.
 */
router.patch('/:id', authMiddleware, (req, res, next) => {
  upload.single('coverImage')(req, res, (err) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? (err.code === 'LIMIT_FILE_SIZE' ? 'Image trop volumineuse (max 5 Mo)' : err.message)
        : (err.message || 'Erreur upload image');
      return res.status(400).json({ error: 'Upload error', message });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    const parsed = updateSalonSchema.parse(req.body);
    const data: import('./salon.service').UpdateSalonInput = { ...parsed };
    if (req.file) {
      data.coverImage = `/uploads/salons/${req.file.filename}`;
    }

    if (Object.keys(data).length === 0) {
      removeUploadedFile(req.file);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Aucun champ à mettre à jour',
      });
    }

    const result = await salonService.updateForOwner(req.userId!, req.params.id, data);
    res.json(result);
  } catch (error: any) {
    removeUploadedFile(req.file);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/salons/:id
 * Soft-delete (isActive=false). Owner only. Last active salon blocked.
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await salonService.deleteForOwner(
      req.userId!,
      req.params.id,
      req.tenantId
    );
    res.json(result);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ error: error.error, message: error.message });
    }
    next(error);
  }
});

export default router;
