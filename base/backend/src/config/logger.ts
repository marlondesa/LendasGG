import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports:
    process.env['NODE_ENV'] === 'production'
      ? [new winston.transports.File({ filename: 'logs/app.log' })]
      : [new winston.transports.Console({ format: winston.format.simple() })],
})

export default logger
