import { validationResult } from 'express-validator';
import Paragraph from '../models/Paragraph.js';

const buildTitle = (title, content) => {
  const trimmed = title?.trim();
  if (trimmed) return trimmed.slice(0, 200);
  const firstLine = content.split('\n').find((line) => line.trim()) || 'Untitled paragraph';
  return firstLine.trim().slice(0, 80) || 'Untitled paragraph';
};

export const getParagraphs = async (req, res) => {
  try {
    const paragraphs = await Paragraph.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: { paragraphs },
    });
  } catch (error) {
    console.error('Get paragraphs error:', error);
    res.status(500).json({ success: false, message: 'Failed to load saved paragraphs' });
  }
};

export const createParagraph = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { title, content } = req.body;
    const paragraph = await Paragraph.create({
      userId: req.user._id,
      title: buildTitle(title, content),
      content: content.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Paragraph saved successfully',
      data: { paragraph },
    });
  } catch (error) {
    console.error('Create paragraph error:', error);
    res.status(500).json({ success: false, message: 'Failed to save paragraph' });
  }
};

export const updateParagraph = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const paragraph = await Paragraph.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!paragraph) {
      return res.status(404).json({ success: false, message: 'Paragraph not found' });
    }

    const { title, content } = req.body;
    paragraph.title = buildTitle(title, content);
    paragraph.content = content.trim();
    await paragraph.save();

    res.status(200).json({
      success: true,
      message: 'Paragraph updated successfully',
      data: { paragraph },
    });
  } catch (error) {
    console.error('Update paragraph error:', error);
    res.status(500).json({ success: false, message: 'Failed to update paragraph' });
  }
};

export const deleteParagraph = async (req, res) => {
  try {
    const paragraph = await Paragraph.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!paragraph) {
      return res.status(404).json({ success: false, message: 'Paragraph not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Paragraph deleted successfully',
    });
  } catch (error) {
    console.error('Delete paragraph error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete paragraph' });
  }
};
