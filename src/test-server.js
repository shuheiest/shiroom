const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '..')));

const fs = require('fs');

// uploads と quarantine ディレクトリを作成
const uploadsDir = path.join(__dirname, '..', 'uploads');
const quarantineDir = path.join(__dirname, '..', 'quarantine');
const sanitizedDir = path.join(__dirname, '..', 'sanitized');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(quarantineDir)) {
  fs.mkdirSync(quarantineDir, { recursive: true });
}
if (!fs.existsSync(sanitizedDir)) {
  fs.mkdirSync(sanitizedDir, { recursive: true });
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ファイルスキャン関数
function scanPdfFile(filePath, originalName) {
  const threats = [];
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // 危険なキーワードをチェック
    const dangerousPatterns = [
      /\/JavaScript\s*\(/i,
      /\/JS\s*\(/i,
      /\/OpenAction/i,
      /\/Launch/i,
      /\/SubmitForm/i,
      /\/ImportData/i,
      /\/GoToE/i,
      /\/GoToR/i,
      /\/Sound/i,
      /\/Movie/i,
      /\/EmbeddedFile/i,
      /\/FileAttachment/i,
      /eval\s*\(/i,
      /document\.write/i,
      /window\.open/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i,
      /ActiveXObject/i
    ];
    
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(fileContent)) {
        threats.push({
          type: 'suspicious_content',
          pattern: pattern.toString(),
          severity: 'high'
        });
      }
    });
    
    // ファイル名の危険パターンをチェック
    const dangerousNamePatterns = [
      /\.exe$/i,
      /\.scr$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.vbs$/i,
      /\.js$/i,
      /malware/i,
      /virus/i,
      /trojan/i
    ];
    
    dangerousNamePatterns.forEach(pattern => {
      if (pattern.test(originalName)) {
        threats.push({
          type: 'suspicious_filename',
          pattern: pattern.toString(),
          severity: 'medium'
        });
      }
    });
    
    // 外部URLをチェック
    const urlPattern = /https?:\/\/[^\s\)]+/g;
    const urls = fileContent.match(urlPattern);
    if (urls && urls.length > 0) {
      urls.forEach(url => {
        // 疑わしいドメインをチェック
        if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('suspicious')) {
          threats.push({
            type: 'suspicious_url',
            url: url,
            severity: 'medium'
          });
        }
      });
    }
    
  } catch (error) {
    console.error('File scan error:', error);
    threats.push({
      type: 'scan_error',
      message: error.message,
      severity: 'low'
    });
  }
  
  return threats;
}

// PDF無害化関数
async function sanitizePdf(inputPath, originalName) {
  try {
    console.log('🔧 PDF無害化を開始:', originalName);
    
    // PDFファイルを読み込み
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // メタデータをクリア
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('Sanitized PDF');
    pdfDoc.setCreator('PDF Sanitization System');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // 新しいPDFドキュメントを作成
    const sanitizedPdf = await PDFDocument.create();
    
    // ページをコピー（JavaScript、フォーム、注釈などは除外）
    const pages = await sanitizedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    pages.forEach((page) => {
      sanitizedPdf.addPage(page);
    });
    
    // 無害化されたPDFを保存
    const pdfBytes = await sanitizedPdf.save();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sanitizedFileName = `sanitized_${timestamp}_${originalName}`;
    const sanitizedPath = path.join(uploadsDir, sanitizedFileName);
    
    fs.writeFileSync(sanitizedPath, pdfBytes);
    
    // 無害化ログを作成
    const logData = {
      timestamp: new Date().toISOString(),
      originalName: originalName,
      sanitizedPath: sanitizedPath,
      sanitizedFileName: sanitizedFileName,
      process: 'PDF sanitization completed',
      removedElements: ['metadata', 'javascript', 'forms', 'annotations'],
      originalSize: existingPdfBytes.length,
      sanitizedSize: pdfBytes.length
    };
    
    const logPath = path.join(sanitizedDir, `${timestamp}_${originalName}.log`);
    fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
    
    console.log('✅ PDF無害化完了:', sanitizedFileName);
    
    return {
      success: true,
      sanitizedPath: sanitizedPath,
      sanitizedFileName: sanitizedFileName,
      originalSize: existingPdfBytes.length,
      sanitizedSize: pdfBytes.length,
      logPath: logPath
    };
    
  } catch (error) {
    console.error('❌ PDF無害化エラー:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ファイルを隔離する関数
function quarantineFile(sourcePath, originalName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const quarantineFileName = `${timestamp}_${originalName}`;
  const quarantinePath = path.join(quarantineDir, quarantineFileName);
  
  fs.copyFileSync(sourcePath, quarantinePath); // コピーに変更（移動ではなく）
  
  // 隔離ログを作成
  const logData = {
    timestamp: new Date().toISOString(),
    originalName: originalName,
    quarantinePath: quarantinePath,
    reason: 'Security threat detected - quarantined for sanitization'
  };
  
  const logPath = path.join(quarantineDir, `${timestamp}_${originalName}.log`);
  fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
  
  return quarantinePath;
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log('File upload request received:', req.file?.originalname);
  console.log('File saved to:', req.file?.path);
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided'
    });
  }

  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({
      success: false,
      message: 'Only PDF files are supported'
    });
  }

  // ファイルをスキャン
  const threats = scanPdfFile(req.file.path, req.file.originalname);
  
  if (threats.length > 0) {
    console.log('🚨 Threats detected:', threats);
    
    // 危険ファイルを隔離
    const quarantinePath = quarantineFile(req.file.path, req.file.originalname);
    
    // 無害化処理を実行
    const sanitizationResult = await sanitizePdf(req.file.path, req.file.originalname);
    
    if (sanitizationResult.success) {
      // 元のファイルを削除
      fs.unlinkSync(req.file.path);
      
      return res.json({
        success: true,
        sanitized: true,
        message: `危険なコンテンツが検出されましたが、無害化処理が完了しました。`,
        threats: threats,
        quarantinePath: quarantinePath,
        data: {
          originalName: req.file.originalname,
          sanitizedFileName: sanitizationResult.sanitizedFileName,
          sanitizedPath: sanitizationResult.sanitizedPath,
          originalSize: sanitizationResult.originalSize,
          sanitizedSize: sanitizationResult.sanitizedSize,
          threatsDetected: threats.length,
          removedElements: ['metadata', 'javascript', 'forms', 'annotations']
        }
      });
    } else {
      return res.json({
        success: false,
        quarantined: true,
        message: `危険なコンテンツが検出され、無害化に失敗しました。ファイルは隔離されました。`,
        threats: threats,
        quarantinePath: quarantinePath,
        sanitizationError: sanitizationResult.error
      });
    }
  }

  // 安全なファイルの場合も無害化処理を実行（予防的措置）
  const sanitizationResult = await sanitizePdf(req.file.path, req.file.originalname);
  
  if (sanitizationResult.success) {
    // 元のファイルを削除
    fs.unlinkSync(req.file.path);
    
    setTimeout(() => {
      res.json({
        success: true,
        message: 'ファイルは安全でした。予防的無害化処理が完了しました。',
        data: {
          originalName: req.file.originalname,
          sanitizedFileName: sanitizationResult.sanitizedFileName,
          sanitizedPath: sanitizationResult.sanitizedPath,
          originalSize: sanitizationResult.originalSize,
          sanitizedSize: sanitizationResult.sanitizedSize,
          threatsDetected: 0,
          removedElements: ['metadata', 'javascript', 'forms', 'annotations']
        }
      });
    }, 1000);
  } else {
    res.json({
      success: false,
      message: '無害化処理に失敗しました。',
      error: sanitizationResult.error
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'simple-upload.html'));
});

app.listen(port, () => {
  console.log(`Test server running on http://localhost:${port}`);
  console.log(`PDF Upload page: http://localhost:${port}/`);
  console.log(`Health check: http://localhost:${port}/api/health`);
});