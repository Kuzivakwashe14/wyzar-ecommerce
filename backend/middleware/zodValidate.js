// backend/middleware/zodValidate.js
// Generic Zod validation middleware factory

/**
 * Creates a validation middleware from a Zod schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body' | 'query' | 'params'} source - Where to get data from (default: body)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        // Format Zod errors for user-friendly response
        // Zod v4 uses 'issues', v3 uses 'errors'
        const zodErrors = result.error.issues || result.error.errors || [];
        const errors = zodErrors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        // Debug logging
        console.error('Validation failed:', {
          source,
          errors: errors,
          body: req[source],
          // If body is FormData/multipart, it might be large or confusing, but for Seller apply it should be just fields
        });

        return res.status(400).json({
          success: false,
          msg: errors[0]?.message || 'Validation failed',
          errors,
        });
      }

      // Replace request data with parsed/sanitized data
      req[source] = result.data;
      next();
    } catch (error) {
      console.error('Zod validation error:', error);
      return res.status(500).json({
        success: false,
        msg: 'Validation error',
        error: error.message,
      });
    }
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
