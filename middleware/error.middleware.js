const CustomError = require("../exceptions/custom_error");

/**
 * Custom error handler to standardize error objects returned to
 * the client
 *
 * @param err Error caught by Express.js
 * @param req Request object provided by Express
 * @param res Response object provided by Express
 * @param next NextFunction function provided by Express
 */

function errorMiddleware(
  error,
  request,
  response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next
) {
  let customError = error;

  if (!(customError instanceof CustomError)) {
    customError = new CustomError("Internal Server Error", 500, "00001", error);
  }
  response.status(customError.status).send(customError);
}

module.exports = errorMiddleware;