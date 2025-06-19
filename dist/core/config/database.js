"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const environment_1 = __importDefault(require("./environment"));
const path_1 = __importDefault(require("path"));
// Import all entities explicitly
const user_model_1 = require("../../models/user.model");
const professional_model_1 = require("../../models/professional.model");
const service_model_1 = require("../../models/service.model");
const package_model_1 = require("../../models/package.model");
const purchase_model_1 = require("../../models/purchase.model");
const appointment_model_1 = require("../../models/appointment.model");
const notification_model_1 = require("../../models/notification.model");
const location_model_1 = require("../../models/location.model");
const typeOrmConfig = {
    type: 'postgres',
    host: environment_1.default.database.host,
    port: environment_1.default.database.port,
    username: environment_1.default.database.username,
    password: environment_1.default.database.password,
    database: environment_1.default.database.database,
    schema: environment_1.default.database.schema,
    synchronize: false, // No sincronizar - ya tenemos una base de datos existente
    migrationsRun: false,
    logging: ['error'],
    // Register all entities explicitly
    entities: [
        // Main entities
        user_model_1.User,
        professional_model_1.Professional,
        service_model_1.Service,
        package_model_1.Package,
        purchase_model_1.Purchase,
        appointment_model_1.Appointment,
        notification_model_1.Notification,
        // Location entities
        location_model_1.Department,
        location_model_1.Township,
        // Fallback to glob pattern for any missing entities
        path_1.default.join(__dirname, '../../models/**/*.{js,ts}')
    ],
    migrations: [path_1.default.join(__dirname, '../migrations/**/*.{js,ts}')],
    ssl: environment_1.default.env === 'production',
};
exports.typeOrmConfig = typeOrmConfig;
const AppDataSource = new typeorm_1.DataSource(typeOrmConfig);
exports.AppDataSource = AppDataSource;
