import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import config from './environment';
import path from 'path';

// Import all entities explicitly
import { User } from '../../models/user.model';
import { Professional } from '../../models/professional.model';
import { Service } from '../../models/service.model';
import { Package } from '../../models/package.model';
import { Purchase } from '../../models/purchase.model';
import { Appointment } from '../../models/appointment.model';
import { Notification } from '../../models/notification.model';
import { Review } from '../../models/review.model';
import { TimeSlot } from '../../models/time-slot.model';
import { Role } from '../../models/role.model';
import { UserRole } from '../../models/user-role.model';
import { UserSession } from '../../models/user-session.model';
import { Schedule } from '../../models/schedule.model';
import { AvailabilityException } from '../../models/availability-exception.model';
import { ProfessionalService } from '../../models/professional-service.model';
import { PackageService } from '../../models/package-service.model';
import { PaymentTransaction } from '../../models/payment-transaction.model';
import { PaymentWebhook } from '../../models/payment-webhook.model';
import { NotificationDeliveryLog } from '../../models/notification-extended.model';
import { Department, Township } from '../../models/location.model';

const typeOrmConfig: PostgresConnectionOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  schema: config.database.schema,
  synchronize: false, // No sincronizar - ya tenemos una base de datos existente
  migrationsRun: false,
  logging: ['error'],

  // Register all entities explicitly
  entities: [
    // Main entities
    User,
    Role,
    UserRole,
    Professional,
    Service,
    ProfessionalService,
    Package,
    PackageService,
    Purchase,
    PaymentTransaction,
    PaymentWebhook,
    UserSession,
    Appointment,
    Schedule,
    TimeSlot,
    AvailabilityException,
    Notification,
    NotificationDeliveryLog,
    Review,

    // Location entities
    Department,
    Township,

    // Fallback to glob pattern for any missing entities
    path.join(__dirname, '../../models/**/*.{js,ts}'),
  ],

  migrations: [path.join(__dirname, '../migrations/**/*.{js,ts}')],
  ssl: config.env === 'production',
};

const AppDataSource = new DataSource(typeOrmConfig);

export { AppDataSource, typeOrmConfig };
