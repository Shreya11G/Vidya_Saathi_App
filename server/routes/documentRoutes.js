import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, param } from 'express-validator';
import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  viewDocument,
  downloadDocument,
  enableSharing,
  disableSharing,
  getSharedDocument,
  viewSharedDocument,
  downloadSharedDocument,
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const documentsDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(documentsDir, req.user._id.toString());
    fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, Word, PowerPoint, TXT, and images.'));
    }
  },
});

const updateValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
];

// Public shared document routes
router.get('/shared/:shareId', param('shareId').isHexadecimal().isLength({ min: 32, max: 32 }), getSharedDocument);
router.get(
  '/shared/:shareId/view',
  param('shareId').isHexadecimal().isLength({ min: 32, max: 32 }),
  viewSharedDocument
);
router.get(
  '/shared/:shareId/download',
  param('shareId').isHexadecimal().isLength({ min: 32, max: 32 }),
  downloadSharedDocument
);

router.use(authenticate);

router.get('/', getDocuments);
router.post('/upload', upload.array('files', 20), uploadDocument);
router.put('/:id', param('id').isMongoId(), updateValidation, updateDocument);
router.delete('/:id', param('id').isMongoId(), deleteDocument);
router.get('/:id/view', param('id').isMongoId(), viewDocument);
router.get('/:id/download', param('id').isMongoId(), downloadDocument);
router.post('/:id/share', param('id').isMongoId(), enableSharing);
router.delete('/:id/share', param('id').isMongoId(), disableSharing);

export default router;
