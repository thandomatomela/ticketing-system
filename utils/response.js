class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static unauthorized(res, message = 'Unauthorized access') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'Access forbidden') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static validationError(res, errors, message = 'Validation failed') {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }
}

module.exports = ApiResponse;

