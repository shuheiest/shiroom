import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import dotenv from 'dotenv';
import logger from './utils/logger';
import prisma from './utils/database';
import { FileStatus } from '@prisma/client';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    let storageStatus: 'available' | 'unavailable' = 'unavailable';
    try {
      const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
      const sanitizedDir = process.env.SANITIZED_DIR || '/app/sanitized';
      
      await fs.access(uploadDir);
      await fs.access(sanitizedDir);
      storageStatus = 'available';
    } catch (error) {
      logger.error('Storage health check failed:', error);
    }

    const isHealthy = databaseStatus === 'connected' && storageStatus === 'available';

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: databaseStatus,
        storage: storageStatus,
      },
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        storage: 'unavailable',
      },
    });
  }
});

// File upload endpoint  
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
    const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    if (req.file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        error: `File size exceeds maximum allowed size of ${maxFileSize} bytes`,
      });
    }

    if (!req.file.mimetype || !req.file.mimetype.includes('pdf')) {
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are currently supported',
      });
    }

    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const fileExtension = path.extname(req.file.originalname || '');
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const uploadPath = path.join(uploadDir, fileName);

    await fs.writeFile(uploadPath, req.file.buffer);

    const fileRecord = await prisma.file.create({
      data: {
        originalName: req.file.originalname || 'unknown',
        originalSize: req.file.size,
        mimeType: req.file.mimetype || 'application/pdf',
        uploadPath,
        checksum,
        status: FileStatus.PENDING,
        userId: req.body.userId,
      },
    });

    logger.info('File uploaded successfully', {
      fileId: fileRecord.id,
      originalName: fileRecord.originalName,
      size: fileRecord.originalSize,
    });

    return res.json({
      success: true,
      data: {
        id: fileRecord.id,
        originalName: fileRecord.originalName,
        size: fileRecord.originalSize,
        mimeType: fileRecord.mimeType,
        status: fileRecord.status,
        uploadedAt: fileRecord.uploadedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('File upload error:', error);
    return res.status(400).json({
      success: false,
      error: 'Failed to upload file',
    });
  }
});

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (): Promise<void> => {
  logger.info('Received shutdown signal, closing server...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();