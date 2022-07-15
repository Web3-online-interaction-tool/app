class CustomError extends Error {
    status; // HTTP status code
  
    errorCode; // Custom error codes. Not HTTP status codes.
  
    message;
  
    errorDetails;
  
    constructor(
      message = "Default Error",
      status = 500,
      errorCode = "00000",
      errorDetails = {}
    ) {
      super(message);
      this.status = status;
      this.errorCode = errorCode;
      this.message = message;
      this.errorDetails = { message, errorDetails };
    }
  }
  
  module.exports = CustomError;