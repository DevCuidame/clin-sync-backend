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
exports.Professional = exports.ProfessionalStatus = void 0;
const typeorm_1 = require("typeorm");
const user_model_1 = require("./user.model");
var ProfessionalStatus;
(function (ProfessionalStatus) {
    ProfessionalStatus["ACTIVE"] = "active";
    ProfessionalStatus["INACTIVE"] = "inactive";
    ProfessionalStatus["SUSPENDED"] = "suspended";
    ProfessionalStatus["PENDING_APPROVAL"] = "pending_approval";
})(ProfessionalStatus || (exports.ProfessionalStatus = ProfessionalStatus = {}));
let Professional = class Professional {
    professional_id;
    user_id;
    license_number;
    specialization;
    bio;
    hourly_rate;
    experience_years;
    status;
    availability_config;
    created_at;
    updated_at;
    // Relaciones
    user;
};
exports.Professional = Professional;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Professional.prototype, "professional_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Professional.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Professional.prototype, "license_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Professional.prototype, "specialization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Professional.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Professional.prototype, "hourly_rate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Professional.prototype, "experience_years", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ProfessionalStatus,
        default: ProfessionalStatus.PENDING_APPROVAL
    }),
    __metadata("design:type", String)
], Professional.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Professional.prototype, "availability_config", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Professional.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Professional.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_model_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_model_1.User)
], Professional.prototype, "user", void 0);
exports.Professional = Professional = __decorate([
    (0, typeorm_1.Entity)('professionals')
], Professional);
