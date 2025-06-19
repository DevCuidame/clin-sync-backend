"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const environment_1 = __importDefault(require("../core/config/environment"));
// Opciones para el logger
const options = {
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    defaultMeta: { service: 'cuidame-health-api' },
    transports: [
        // Escribir todos los logs con nivel 'info' y menos a console
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)),
            level: environment_1.default.logging.level
        }),
    ]
};
// Si estamos en producción, agregar un archivo de log para errores
if (environment_1.default.env === 'production') {
    if (options.transports) {
        if (Array.isArray(options.transports)) {
            options.transports.push(new winston_1.default.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }), new winston_1.default.transports.File({
                filename: 'logs/combined.log',
                maxsize: 5242880, // 5MB
                maxFiles: 5,
            }));
        }
        else {
            options.transports = [
                options.transports,
                new winston_1.default.transports.File({
                    filename: 'logs/error.log',
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston_1.default.transports.File({
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                })
            ];
        }
    }
}
const logger = winston_1.default.createLogger(options);
exports.default = logger;
