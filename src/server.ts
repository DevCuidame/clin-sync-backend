import app from './app';
import config from './core/config/environment';
import logger from './utils/logger';
import http from 'http';
// import expressWs from 'express-ws';
// Establecer puerto
const PORT = config.server.port;
const HOST = config.server.host;

// Crear servidor HTTP
const server = http.createServer(app);
// expressWs(app, server);

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url || '';
  logger.debug(`🔄 Upgrade request for: ${pathname}`);
});


// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`🚀 Servidor ejecutándose en http://${HOST}:${PORT}`);
  logger.info(
    `📚 API disponible en http://${HOST}:${PORT}${config.server.apiPrefix}`
  );
  logger.info(`🌍 Entorno: ${config.env}`);
});

// Manejar errores del servidor
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`❌ Puerto ${PORT} ya está en uso`);
  } else {
    logger.error(`❌ Error del servidor: ${error}`);
  }
  process.exit(1);
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido. Cerrando servidor HTTP');
  shutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido. Cerrando servidor HTTP');
  shutdown();
});

// Función para cerrar graciosamente
const shutdown = () => {
  server.close(() => {
    logger.info('Servidor HTTP cerrado');
    process.exit(0);
  });

  // Forzar cierre si tarda más de 10 segundos
  setTimeout(() => {
    logger.error('Cierre forzado después del tiempo de espera');
    process.exit(1);
  }, 10000);
};

export default server;
