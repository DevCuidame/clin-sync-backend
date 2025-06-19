"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplate = exports.NotificationQueue = exports.NotificationPreference = exports.NotificationDeliveryLog = exports.PreferenceType = exports.QueueStatus = exports.DeliveryChannel = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
const user_model_1 = require("./user.model");
const notification_model_1 = require("./notification.model");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["SENT"] = "sent";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["READ"] = "read";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var DeliveryChannel;
(function (DeliveryChannel) {
    DeliveryChannel["EMAIL"] = "email";
    DeliveryChannel["SMS"] = "sms";
    DeliveryChannel["PUSH"] = "push";
    DeliveryChannel["IN_APP"] = "in_app";
})(DeliveryChannel || (exports.DeliveryChannel = DeliveryChannel = {}));
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["PENDING"] = "pending";
    QueueStatus["PROCESSING"] = "processing";
    QueueStatus["COMPLETED"] = "completed";
    QueueStatus["FAILED"] = "failed";
    QueueStatus["RETRYING"] = "retrying";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
var PreferenceType;
(function (PreferenceType) {
    PreferenceType["EMAIL"] = "email";
    PreferenceType["SMS"] = "sms";
    PreferenceType["PUSH"] = "push";
    PreferenceType["IN_APP"] = "in_app";
})(PreferenceType || (exports.PreferenceType = PreferenceType = {}));
let NotificationDeliveryLog = class NotificationDeliveryLog {
    log_id;
    notification_id;
    channel;
    status;
    error_message;
    metadata;
    created_at;
    updated_at;
    // Relaciones
    notification;
};
exports.NotificationDeliveryLog = NotificationDeliveryLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], NotificationDeliveryLog.prototype, "log_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationDeliveryLog.prototype, "notification_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DeliveryChannel
    }),
    __metadata("design:type", String)
], NotificationDeliveryLog.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DeliveryStatus
    }),
    __metadata("design:type", String)
], NotificationDeliveryLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], NotificationDeliveryLog.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], NotificationDeliveryLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationDeliveryLog.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationDeliveryLog.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => notification_model_1.Notification),
    (0, typeorm_1.JoinColumn)({ name: 'notification_id' }),
    __metadata("design:type", notification_model_1.Notification)
], NotificationDeliveryLog.prototype, "notification", void 0);
exports.NotificationDeliveryLog = NotificationDeliveryLog = __decorate([
    (0, typeorm_1.Entity)('notification_delivery_logs')
], NotificationDeliveryLog);
let NotificationPreference = class NotificationPreference {
    preference_id;
    user_id;
    type;
    enabled;
    settings;
    created_at;
    updated_at;
    // Relaciones
    user;
};
exports.NotificationPreference = NotificationPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], NotificationPreference.prototype, "preference_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationPreference.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PreferenceType
    }),
    __metadata("design:type", String)
], NotificationPreference.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationPreference.prototype, "enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], NotificationPreference.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationPreference.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationPreference.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_model_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_model_1.User)
], NotificationPreference.prototype, "user", void 0);
exports.NotificationPreference = NotificationPreference = __decorate([
    (0, typeorm_1.Entity)('notification_preferences')
], NotificationPreference);
let NotificationQueue = class NotificationQueue {
    queue_id;
    notification_id;
    channel;
    status;
    scheduled_for;
    retry_count;
    max_retries;
    error_message;
    payload;
    created_at;
    updated_at;
    // Relaciones
    notification;
};
exports.NotificationQueue = NotificationQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "queue_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "notification_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DeliveryChannel
    }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: QueueStatus,
        default: QueueStatus.PENDING
    }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "scheduled_for", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "retry_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], NotificationQueue.prototype, "max_retries", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], NotificationQueue.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], NotificationQueue.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationQueue.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => notification_model_1.Notification),
    (0, typeorm_1.JoinColumn)({ name: 'notification_id' }),
    __metadata("design:type", notification_model_1.Notification)
], NotificationQueue.prototype, "notification", void 0);
exports.NotificationQueue = NotificationQueue = __decorate([
    (0, typeorm_1.Entity)('notification_queue')
], NotificationQueue);
let NotificationTemplate = class NotificationTemplate {
    template_id;
    name;
    subject;
    body;
    variables;
    is_active;
    created_at;
    updated_at;
};
exports.NotificationTemplate = NotificationTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], NotificationTemplate.prototype, "template_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], NotificationTemplate.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], NotificationTemplate.prototype, "variables", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], NotificationTemplate.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationTemplate.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], NotificationTemplate.prototype, "updated_at", void 0);
exports.NotificationTemplate = NotificationTemplate = __decorate([
    (0, typeorm_1.Entity)('notification_templates')
], NotificationTemplate);
