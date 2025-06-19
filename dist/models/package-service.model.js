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
exports.PackageService = void 0;
const typeorm_1 = require("typeorm");
const package_model_1 = require("./package.model");
const service_model_1 = require("./service.model");
let PackageService = class PackageService {
    package_service_id;
    package_id;
    service_id;
    sessions_included;
    created_at;
    // Relaciones
    package;
    service;
};
exports.PackageService = PackageService;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], PackageService.prototype, "package_service_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PackageService.prototype, "package_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PackageService.prototype, "service_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PackageService.prototype, "sessions_included", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PackageService.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => package_model_1.Package, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'package_id' }),
    __metadata("design:type", package_model_1.Package)
], PackageService.prototype, "package", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => service_model_1.Service, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'service_id' }),
    __metadata("design:type", service_model_1.Service)
], PackageService.prototype, "service", void 0);
exports.PackageService = PackageService = __decorate([
    (0, typeorm_1.Entity)('package_services')
], PackageService);
