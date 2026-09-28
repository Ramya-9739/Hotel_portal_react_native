const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/s3");

const BUCKET = process.env.S3_BUCKET_NAME;
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

/**
 * Uploads a buffer to S3 under hotelId's directory and returns the CloudFront URL.
 * key format convention: `${hotelId}/${folder}/${fileName}`
 */
const uploadToS3 = async (hotelId, folder, fileName, buffer, mimeType) => {
  const key = `${hotelId}/${folder}/${fileName}`;

  // ---- DUMMY CALL: swap in real S3 client if using a different SDK/version ----
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return getS3Url(key);
};

const getS3Url = (key) => `${CDN_DOMAIN}/${key}`;

const deleteFromS3 = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = { uploadToS3, getS3Url, deleteFromS3 };
