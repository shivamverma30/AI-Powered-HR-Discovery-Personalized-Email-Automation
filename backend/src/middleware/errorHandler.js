// Handles requests that did not match any route.
export function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
}

// Centralized error handler. Keeps error responses consistent.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
  })
}
