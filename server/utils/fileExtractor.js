import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

import mammoth from 'mammoth';
import officeParser from 'officeparser';
import fs from 'fs/promises';
import path from 'path';

/**
 * Extract text from PDF files
 */
const extractFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

/**
 * Extract text from Word documents (.docx/.doc)
 */
const extractFromWord = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
};

/**
 * Extract text from PowerPoint files (.pptx/.ppt)
 */
const extractFromPowerPoint = async (filePath) => {
  try {
    const text = await officeParser.parseOfficeAsync(filePath);
    return text;
  } catch (error) {
    console.error('PowerPoint extraction error:', error);
    throw new Error('Failed to extract text from PowerPoint file');
  }
};

/**
 * Main function to extract text from any supported file type
 */
export const extractTextFromFile = async (file) => {
  if (!file || !file.path) throw new Error('Invalid file object');

  const filePath = path.resolve(file.path);
  const fileName = file.originalname.toLowerCase();

  try {
    // ✅ Ensure file exists before reading
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File not found at: ${filePath}`);
    }

    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      extractedText = await extractFromPDF(filePath);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      extractedText = await extractFromWord(filePath);
    } else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      extractedText = await extractFromPowerPoint(filePath);
    } else {
      throw new Error('Unsupported file type. Please upload PDF, DOCX, or PPTX files.');
    }

    // ✅ Clean text (remove extra whitespace/newlines)
    extractedText = extractedText.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

    if (!extractedText || extractedText.length < 100) {
      throw new Error('Insufficient text content extracted from file');
    }

    return extractedText;
  } finally {
    // 🧹 Cleanup uploaded file safely
    try {
      await fs.unlink(filePath);
    } catch (err) {
      console.warn('File cleanup error:', err.message);
    }
  }
};
