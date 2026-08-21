module.exports = {
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  MAX_FILE_SIZE: Number(process.env.UPLOAD_MAX_FILE_MB || 5) * 1024 * 1024,
  MAX_DISK_BYTES: Number(process.env.UPLOAD_MAX_DISK_MB || 500) * 1024 * 1024,
  RATE_LIMIT_WINDOW_MS: Number(process.env.UPLOAD_RATE_WINDOW_MIN || 15) * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.UPLOAD_RATE_MAX || 30)
};
