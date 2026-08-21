const fs = require('fs');
const path = require('path');
const multer = require('multer');
const i18n = require('../config/i18n');
const {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIMES,
  MAX_FILE_SIZE
} = require('../config/uploadSecurity');
const { getPublicFolderPath } = require('./publicUpload');

const SIGNATURES = {
  '.jpg': [[0xff, 0xd8, 0xff]],
  '.jpeg': [[0xff, 0xd8, 0xff]],
  '.png': [[0x89, 0x50, 0x4e, 0x47]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]],
  '.pdf': [[0x25, 0x50, 0x44, 0x46]]
};

function getSafeExtension(originalname) {
  const ext = path.extname(originalname || '').toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : null;
}

function fileFilter(req, file, cb) {
  const ext = getSafeExtension(file.originalname);
  if (!ext || !ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(i18n.__('invalid_file_type')));
  }
  cb(null, true);
}

function safeFilename(req, file, cb) {
  const ext = getSafeExtension(file.originalname);
  if (!ext) {
    return cb(new Error(i18n.__('invalid_file_type')));
  }
  cb(null, `${Date.now()}${ext}`);
}

const multerOptions = {
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
};

const privateUpload = multer({
  ...multerOptions,
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: safeFilename
  })
});

const publicUpload = multer({
  ...multerOptions,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, getPublicFolderPath(req.body.folder));
    },
    filename: safeFilename
  })
});

const memoryUpload = multer({
  ...multerOptions,
  storage: multer.memoryStorage()
});

function matchesSignature(buffer, signature) {
  return signature.every((byte, index) => buffer[index] === byte);
}

function validateMagicBytes(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const signatures = SIGNATURES[ext];
  if (!signatures) {
    throw new Error(i18n.__('invalid_file_type'));
  }

  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 12, 0);
  fs.closeSync(fd);

  const isValid = signatures.some((signature) => matchesSignature(buffer, signature));
  if (!isValid) {
    throw new Error(i18n.__('invalid_file_type'));
  }
}

function validateFileOnDisk(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (req.file.path) {
      validateMagicBytes(req.file.path);
    } else if (req.file.buffer) {
      const ext = getSafeExtension(req.file.originalname);
      const signatures = SIGNATURES[ext];
      const isValid = signatures?.some((signature) => matchesSignature(req.file.buffer, signature));
      if (!isValid) {
        throw new Error(i18n.__('invalid_file_type'));
      }
    }
    next();
  } catch (error) {
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: error.message || i18n.__('invalid_file_type') });
  }
}

function handleMulterError(err, req, res, next) {
  if (!err) return next();

  if (req.file?.path && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: i18n.__('upload_file_too_large') });
  }

  return res.status(400).json({
    message: err.message || i18n.__('invalid_file_type')
  });
}

function runUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) return handleMulterError(err, req, res, next);
      validateFileOnDisk(req, res, next);
    });
  };
}

module.exports = {
  privateUpload,
  publicUpload,
  memoryUpload,
  runUpload,
  handleMulterError
};
