export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  const status = error.statusCode || 500;
  res.status(status).json({
    message: error.message || 'Server error.'
  });
}
