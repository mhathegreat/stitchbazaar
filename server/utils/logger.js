/**
 * Winston logger
 * - Console output in development
 * - Error file: logs/error.log
 * - Combined file: logs/combined.log
 */

import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir   = path.join(__dirname, '..', 'logs')

// Ensure logs/ directory exists
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const { combine, timestamp, printf, colorize, errors } = winston.format

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack ? `${timestamp} ${level}: ${message}\n${stack}` : `${timestamp} ${level}: ${message}`
  )
)

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  winston.format.json()
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level:    'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
})
