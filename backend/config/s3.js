const { S3Client } = require("@aws-sdk/client-s3");

const isS3Configured = () => {
  const key = (process.env.AWS_ACCESS_KEY_ID || "").trim();
  const secret = (process.env.AWS_SECRET_ACCESS_KEY || "").trim();
  const bucket = (process.env.S3_BUCKET_NAME || "").trim();

  // Return false if credentials are blank or placeholders
  if (!key || !secret || !bucket) return false;
  if (key.startsWith("dummy") || key.startsWith("your_") || secret.startsWith("dummy")) return false;
  return true;
};

const clientOptions = {
  region: process.env.AWS_REGION || "ap-south-1",
};

// If explicit IAM user credentials are provided, pass them; otherwise fallback to IAM role / default chain
if (isS3Configured()) {
  clientOptions.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim(),
  };
}

const s3Client = new S3Client(clientOptions);

module.exports = { s3Client, isS3Configured };
