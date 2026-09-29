const { sendError } = require("../utils/responseHelper");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  sendError(res, err.message || "Internal server error", err.statusCode || 500);
};

module.exports = errorHandler;
