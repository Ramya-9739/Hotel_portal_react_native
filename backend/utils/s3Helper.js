const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3Client = require("../config/s3");

const BUCKET = process.env.S3_BUCKET_NAME || 'hotel-portal-bucket';
const CDN_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'https://cdn.hotelportal.com';

/**
 * Uploads a buffer to S3 under hotelId's directory and returns the CloudFront URL.
 * key format convention: `${hotelId}/${folder}/${fileName}`
 */
const uploadToS3 = async (hotelId, folder, fileName, buffer, mimeType) => {
  const key = `${hotelId}/${folder}/${fileName}`;

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

const generatePresignedUrl = async (hotelId, folder, fileName, mimeType) => {
  const key = `${hotelId}/${folder}/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { uploadUrl: url, key, fileUrl: getS3Url(key) };
};

const getS3Url = (key) => `${CDN_DOMAIN}/${key}`;

const deleteFromS3 = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = { uploadToS3, generatePresignedUrl, getS3Url, deleteFromS3 };
