const multer = require("multer");

// Keeps file in memory (buffer) so it can be piped straight to S3 —
// no disk write on the EC2 instance.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
