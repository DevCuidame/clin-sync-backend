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
exports.UserSession = exports.UserSessionStatus = void 0;
const typeorm_1 = require("typeorm");
const purchase_model_1 = require("./purchase.model");
const service_model_1 = require("./service.model");
const appointment_model_1 = require("./appointment.model");
var UserSessionStatus;
(function (UserSessionStatus) {
    UserSessionStatus["ACTIVE"] = "active";
    UserSessionStatus["EXPIRED"] = "expired";
    UserSessionStatus["EXHAUSTED"] = "exhausted";
    UserSessionStatus["CANCELLED"] = "cancelled";
})(UserSessionStatus || (exports.UserSessionStatus = UserSessionStatus = {}));
let UserSession = class UserSession {
    user_session_id;
    purchase_id;
    service_id;
    sessions_remaining;
    expires_at;
    status;
    created_at;
    updated_at;
    // Relaciones
    purchase;
    service;
    appointments;
};
exports.UserSession = UserSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], UserSession.prototype, "user_session_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserSession.prototype, "purchase_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserSession.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], UserSession.prototype, "sessions_remaining", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], UserSession.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserSessionStatus,
        default: UserSessionStatus.ACTIVE
    }),
    __metadata("design:type", String)
], UserSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserSession.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserSession.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => purchase_model_1.Purchase, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'purchase_id' }),
    __metadata("design:type", purchase_model_1.Purchase)
], UserSession.prototype, "purchase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_model_1.Service, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_model_1.Service)
], UserSession.prototype, "service", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => appointment_model_1.Appointment, appointment => appointment.user_session),
    __metadata("design:type", Array)
], UserSession.prototype, "appointments", void 0);
exports.UserSession = UserSession = __decorate([
    (0, typeorm_1.Entity)('user_sessions')
], UserSession);
