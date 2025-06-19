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
exports.ProfessionalService = void 0;
const typeorm_1 = require("typeorm");
const professional_model_1 = require("./professional.model");
const service_model_1 = require("./service.model");
let ProfessionalService = class ProfessionalService {
    prof_service_id;
    professional_id;
    service_id;
    custom_price;
    custom_duration;
    is_active;
    created_at;
    // Relaciones
    professional;
    service;
};
exports.ProfessionalService = ProfessionalService;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], ProfessionalService.prototype, "prof_service_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProfessionalService.prototype, "professional_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProfessionalService.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ProfessionalService.prototype, "custom_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], ProfessionalService.prototype, "custom_duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ProfessionalService.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProfessionalService.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => professional_model_1.Professional),
    (0, typeorm_1.JoinColumn)({ name: 'professional_id' }),
    __metadata("design:type", professional_model_1.Professional)
], ProfessionalService.prototype, "professional", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_model_1.Service),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_model_1.Service)
], ProfessionalService.prototype, "service", void 0);
exports.ProfessionalService = ProfessionalService = __decorate([
    (0, typeorm_1.Entity)('professional_services')
], ProfessionalService);
