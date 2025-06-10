import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface Config {
  env: string;
  enableCorsHandling: boolean;
  server: {
    port: number;
    host: string;
    apiPrefix: string;
    production_url: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    schema: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  logging: {
    level: string;
  };
  fileUpload: {
    path: string;
    maxSize: number; // en MB
  };
  email: {
    host: string;
    port: number;
    user: string;
    secure: boolean;
    password: string;
    from: string;
  };
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// Configuración por defecto
const config: Config = {
  enableCorsHandling: process.env.ENABLE_CORS_HANDLING  === 'true',
  env: process.env.NODE_ENV || 'development',
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api',
    production_url: process.env.PRODUCTION_URL || 'health.cuidame.tech'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'DataPostGF104',
    database: process.env.DB_NAME || 'db_cuidame',
    schema: process.env.DB_SCHEMA || 'public',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  fileUpload: {
    path: process.env.FILE_UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE || '10', 10),
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER || '  email',
    secure: process.env.EMAIL_SECURE === 'true',
    password: process.env.EMAIL_PASSWORD || 'PASSWORD',
    from: process.env.EMAIL_FROM || 'EMAIL',
  }
};

// Agregar configuración de Google Calendar si las variables están disponibles
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  config.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/api/appointments/google-calendar/callback'
  };
}

// Validar configuración crítica en producción
if (config.env === 'production') {
  // Verificar la clave secreta JWT
  if (config.jwt.secret === 'default_jwt_secret_key_change_in_production') {
    throw new Error('JWT_SECRET debe ser configurado en producción');
  }
  
  // Verificar la configuración de la base de datos
  if (config.database.password === 'postgres') {
    throw new Error('Se recomienda cambiar la contraseña por defecto de la base de datos en producción');
  }
}

export default config;