/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema before passing to controller.
 * Returns 422 with field-level errors on failure.
 *
 * @example
 * router.post('/login', validate(loginSchema), authController.login)
 */

/**
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const rawIssues = result.error.issues ?? result.error.errors ?? []
    const errors = rawIssues.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }))
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }
    // Replace with parsed (coerced + stripped) data
    req[source] = result.data
    next()
  }
}
