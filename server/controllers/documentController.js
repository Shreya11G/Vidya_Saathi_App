import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { validationResult } from 'express-validator';
import Document from '../models/Document.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCUMENTS_DIR = path.join(__dirname, '..', 'uploads', 'documents');

const buildTitle = (title, originalFileName) => {
  const trimmed = title?.trim();
  if (trimmed) return trimmed.slice(0, 200);
  return originalFileName.replace(/\.[^.]+$/, '') || 'Untitled document';
};

const getFilePath = (storedFileName) => path.join(DOCUMENTS_DIR, storedFileName);

const sendFile = (res, filePath, originalFileName, mimeType, inline = false) => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(originalFileName)}"`
  );
  res.sendFile(filePath);
};

export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('-storedFileName')
      .lean();

    res.status(200).json({
      success: true,
      data: { documents },
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'Failed to load documents' });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];

    if (files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, description } = req.body;
    const created = [];

    for (const file of files) {
      const relativePath = path.join(req.user._id.toString(), file.filename);
      const docTitle =
        files.length === 1
          ? buildTitle(title, file.originalname)
          : buildTitle(null, file.originalname);

      const document = await Document.create({
        userId: req.user._id,
        title: docTitle,
        description: description?.trim()?.slice(0, 1000) || '',
        originalFileName: file.originalname,
        storedFileName: relativePath,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
      created.push(document);
    }

    res.status(201).json({
      success: true,
      message:
        created.length === 1
          ? 'Document uploaded successfully'
          : `${created.length} documents uploaded successfully`,
      data: { documents: created, document: created[0] },
    });
  } catch (error) {
    const files = req.files?.length ? req.files : req.file ? [req.file] : [];
    for (const file of files) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Could not save document. Please try again.',
      });
    }

    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const { title, description } = req.body;
    if (title !== undefined) document.title = title.trim().slice(0, 200);
    if (description !== undefined) document.description = description.trim().slice(0, 1000);
    await document.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: { document },
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ success: false, message: 'Failed to update document' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await fs.unlink(getFilePath(document.storedFileName)).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

export const viewDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = getFilePath(document.storedFileName);
    await fs.access(filePath);
    sendFile(res, filePath, document.originalFileName, document.mimeType, true);
  } catch (error) {
    console.error('View document error:', error);
    res.status(404).json({ success: false, message: 'Document file not found' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const filePath = getFilePath(document.storedFileName);
    await fs.access(filePath);
    sendFile(res, filePath, document.originalFileName, document.mimeType, false);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(404).json({ success: false, message: 'Document file not found' });
  }
};

export const enableSharing = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!document.shareId) {
      document.shareId = Document.generateShareId();
    }
    document.isShared = true;
    await document.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareUrl = `${clientUrl}/documents/shared/${document.shareId}`;

    res.status(200).json({
      success: true,
      message: 'Sharing enabled',
      data: {
        shareId: document.shareId,
        shareUrl,
        document,
      },
    });
  } catch (error) {
    console.error('Enable sharing error:', error);
    res.status(500).json({ success: false, message: 'Failed to enable sharing' });
  }
};

export const disableSharing = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    document.isShared = false;
    document.shareId = undefined;
    await document.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Sharing disabled',
      data: { document },
    });
  } catch (error) {
    console.error('Disable sharing error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable sharing' });
  }
};

export const getSharedDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareId: req.params.shareId,
      isShared: true,
    })
      .select('title description originalFileName mimeType fileSize createdAt shareId')
      .lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Shared document not found or sharing has been disabled',
      });
    }

    res.status(200).json({
      success: true,
      data: { document },
    });
  } catch (error) {
    console.error('Get shared document error:', error);
    res.status(500).json({ success: false, message: 'Failed to load shared document' });
  }
};

export const viewSharedDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareId: req.params.shareId,
      isShared: true,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Shared document not found' });
    }

    const filePath = getFilePath(document.storedFileName);
    await fs.access(filePath);
    sendFile(res, filePath, document.originalFileName, document.mimeType, true);
  } catch (error) {
    console.error('View shared document error:', error);
    res.status(404).json({ success: false, message: 'Shared document file not found' });
  }
};

export const downloadSharedDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      shareId: req.params.shareId,
      isShared: true,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Shared document not found' });
    }

    const filePath = getFilePath(document.storedFileName);
    await fs.access(filePath);
    sendFile(res, filePath, document.originalFileName, document.mimeType, false);
  } catch (error) {
    console.error('Download shared document error:', error);
    res.status(404).json({ success: false, message: 'Shared document file not found' });
  }
};
