"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const environment_1 = __importDefault(require("./core/config/environment"));
const logger_1 = __importDefault(require("./utils/logger"));
const http_1 = __importDefault(require("http"));
// import expressWs from 'express-ws';
// Establecer puerto
const PORT = environment_1.default.server.port;
const HOST = environment_1.default.server.host;
// Crear servidor HTTP
const server = http_1.default.createServer(app_1.default);
// expressWs(app, server);
server.on('upgrade', (request, socket, head) => {
    const pathname = request.url || '';
    logger_1.default.debug(`🔄 Upgrade request for: ${pathname}`);
});
// Iniciar servidor
server.listen(PORT, () => {
    logger_1.default.info(`🚀 Servidor ejecutándose en http://${HOST}:${PORT}`);
    logger_1.default.info(`📚 API disponible en http://${HOST}:${PORT}${environment_1.default.server.apiPrefix}`);
    logger_1.default.info(`🌍 Entorno: ${environment_1.default.env}`);
});
// Manejar errores del servidor
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger_1.default.error(`❌ Puerto ${PORT} ya está en uso`);
    }
    else {
        logger_1.default.error(`❌ Error del servidor: ${error}`);
    }
    process.exit(1);
});
// Manejar señales de terminación
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM recibido. Cerrando servidor HTTP');
    shutdown();
});
process.on('SIGINT', () => {
    logger_1.default.info('SIGINT recibido. Cerrando servidor HTTP');
    shutdown();
});
// Función para cerrar graciosamente
const shutdown = () => {
    server.close(() => {
        logger_1.default.info('Servidor HTTP cerrado');
        process.exit(0);
    });
    // Forzar cierre si tarda más de 10 segundos
    setTimeout(() => {
        logger_1.default.error('Cierre forzado después del tiempo de espera');
        process.exit(1);
    }, 10000);
};
exports.default = server;
