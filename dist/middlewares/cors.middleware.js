"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const environment_1 = __importDefault(require("../core/config/environment"));
const corsMiddleware = (req, res, next) => {
    // Si CORS está manejado por Apache, solo manejar OPTIONS
    if (environment_1.default.enableCorsHandling) {
        console.log('CORS middleware DESACTIVADO - Apache maneja CORS');
        // Solo manejar OPTIONS si Apache no lo maneja bien
        if (req.method === 'OPTIONS') {
            console.log('Handling OPTIONS request for:', req.path);
            res.status(200).end();
            return;
        }
        // Para otros métodos, continuar sin agregar headers
        return next();
    }
    // Si Node.js maneja CORS
    // Skip CORS para WebSocket upgrade requests
    if (req.headers.upgrade &&
        req.headers.upgrade.toLowerCase() === 'websocket') {
        return next();
    }
    // Define allowed origins
    const allowedOrigins = [
        'http://localhost:8100',
        'http://localhost:4200',
        'https://health.cuidame.tech',
    ];
    // Get the origin from the request
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    else if (environment_1.default.env === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', 'https://health.cuidame.tech');
    }
    // Configurar otros headers CORS
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        console.log('Handling OPTIONS request for:', req.path);
        res.status(200).end();
        return;
    }
    // Continuar con la siguiente función para non-OPTIONS requests
    next();
};
exports.corsMiddleware = corsMiddleware;
