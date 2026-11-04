const fs = require("fs");
const path = require("path");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, isS3Configured } = require("../config/s3");

const BUCKET = process.env.S3_BUCKET_NAME || 'hotel-portal-bucket';
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'https://cdn.hotelportal.com';
const PORT = process.env.PORT || 3000;

// Save buffer to local disk uploads directory and return public HTTP URL
const saveLocally = (folder, fileName, buffer) => {
  const uploadsDir = path.join(__dirname, "..", "uploads", folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeFileName);
  fs.writeFileSync(filePath, buffer);
  const localUrl = `http://localhost:${PORT}/uploads/${folder}/${safeFileName}`;
  console.log(`[Media Storage] Stored media file locally at ${localUrl}`);
  return localUrl;
};

/**
 * Uploads a buffer to S3 under hotelId's directory and returns the CloudFront URL.
 * Falls back safely to local disk storage if AWS S3 is unconfigured or unavailable.
 */
const uploadToS3 = async (hotelId, folder, fileName, buffer, mimeType) => {
  const key = `${hotelId}/${folder}/${fileName}`;

  // If S3 is properly configured with real credentials, upload to S3
  if (isS3Configured()) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      return getS3Url(key);
    } catch (err) {
      console.warn(`[S3 Upload Warning] Cloud upload to S3 failed (${err.message}). Using local media storage fallback.`);
      return saveLocally(folder, `${hotelId}-${fileName}`, buffer);
    }
  }

  // Resilient fallback: Save to local disk uploads directory
  return saveLocally(folder, `${hotelId}-${fileName}`, buffer);
};

const generatePresignedUrl = async (hotelId, folder, fileName, mimeType) => {
  const key = `${hotelId}/${folder}/${fileName}`;
  if (!isS3Configured()) {
    return {
      uploadUrl: null,
      key,
      fileUrl: `http://localhost:${PORT}/uploads/${folder}/${hotelId}-${fileName}`,
      isLocal: true,
      message: "AWS S3 credentials not configured; local media upload supported directly via POST /api/hotel-pictures",
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl: url, key, fileUrl: getS3Url(key), isLocal: false };
};

const getS3Url = (key) => `${CDN_DOMAIN}/${key}`;

const deleteFromS3 = async (key) => {
  if (!key) return;
  if (key.includes("/uploads/")) {
    try {
      const relPath = key.split("/uploads/")[1];
      const localPath = path.join(__dirname, "..", "uploads", relPath);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (e) {
      console.warn('[Local Media Delete Warning]:', e.message);
    }
  } else if (isS3Configured()) {
    try {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (err) {
      console.warn(`[S3 Delete Warning] Failed to delete ${key} from S3:`, err.message);
    }
  }
};

module.exports = { uploadToS3, generatePresignedUrl, getS3Url, deleteFromS3 };
