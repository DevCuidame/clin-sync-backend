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
exports.AvailabilityException = exports.ExceptionType = void 0;
const typeorm_1 = require("typeorm");
const professional_model_1 = require("./professional.model");
var ExceptionType;
(function (ExceptionType) {
    ExceptionType["UNAVAILABLE"] = "unavailable";
    ExceptionType["AVAILABLE"] = "available";
    ExceptionType["BREAK"] = "break";
    ExceptionType["VACATION"] = "vacation";
})(ExceptionType || (exports.ExceptionType = ExceptionType = {}));
let AvailabilityException = class AvailabilityException {
    exception_id;
    professional_id;
    exception_date;
    start_time;
    end_time;
    type;
    reason;
    created_at;
    // Relaciones
    professional;
};
exports.AvailabilityException = AvailabilityException;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], AvailabilityException.prototype, "exception_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], AvailabilityException.prototype, "professional_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], AvailabilityException.prototype, "exception_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", String)
], AvailabilityException.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time', nullable: true }),
    __metadata("design:type", String)
], AvailabilityException.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ExceptionType
    }),
    __metadata("design:type", String)
], AvailabilityException.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], AvailabilityException.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AvailabilityException.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => professional_model_1.Professional),
    (0, typeorm_1.JoinColumn)({ name: 'professional_id' }),
    __metadata("design:type", professional_model_1.Professional)
], AvailabilityException.prototype, "professional", void 0);
exports.AvailabilityException = AvailabilityException = __decorate([
    (0, typeorm_1.Entity)('availability_exceptions')
], AvailabilityException);
