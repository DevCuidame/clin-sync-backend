import winston from 'winston';
import config from '../core/config/environment';

// Opciones para el logger
const options: winston.LoggerOptions = {
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cuidame-health-api' },
  transports: [
    // Escribir todos los logs con nivel 'info' y menos a console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
      level: config.logging.level
    }),
  ]
};

// Si estamos en producción, agregar un archivo de log para errores
if (config.env === 'production') {
  if (options.transports) {
    if (Array.isArray(options.transports)) {
      options.transports.push(
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5, 
        })
      );
    } else {
      options.transports = [
        options.transports,
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5, 
        })
      ];
    }
  }
}

const logger = winston.createLogger(options);

export default logger;