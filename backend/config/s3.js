const { S3Client } = require("@aws-sdk/client-s3");

// ---- DUMMY CONFIG: replace with real IAM role / credentials on EC2 ----
// On EC2, prefer an attached IAM role over hardcoded keys — omit
// credentials entirely and the SDK will pick up the instance role.
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  // credentials: {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // },
});

module.exports = s3Client;
