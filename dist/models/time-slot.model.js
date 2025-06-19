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
exports.TimeSlot = exports.SlotStatus = void 0;
const typeorm_1 = require("typeorm");
const professional_model_1 = require("./professional.model");
var SlotStatus;
(function (SlotStatus) {
    SlotStatus["AVAILABLE"] = "available";
    SlotStatus["BOOKED"] = "booked";
    SlotStatus["BLOCKED"] = "blocked";
    SlotStatus["CANCELLED"] = "cancelled";
})(SlotStatus || (exports.SlotStatus = SlotStatus = {}));
let TimeSlot = class TimeSlot {
    slot_id;
    professional_id;
    slot_date;
    start_time;
    end_time;
    duration_minutes;
    status;
    price_override;
    max_bookings;
    current_bookings;
    metadata;
    created_at;
    updated_at;
    // Relaciones
    professional;
};
exports.TimeSlot = TimeSlot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], TimeSlot.prototype, "slot_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TimeSlot.prototype, "professional_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], TimeSlot.prototype, "slot_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], TimeSlot.prototype, "start_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], TimeSlot.prototype, "end_time", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], TimeSlot.prototype, "duration_minutes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SlotStatus,
        default: SlotStatus.AVAILABLE
    }),
    __metadata("design:type", String)
], TimeSlot.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], TimeSlot.prototype, "price_override", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], TimeSlot.prototype, "max_bookings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], TimeSlot.prototype, "current_bookings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], TimeSlot.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TimeSlot.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TimeSlot.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => professional_model_1.Professional),
    (0, typeorm_1.JoinColumn)({ name: 'professional_id' }),
    __metadata("design:type", professional_model_1.Professional)
], TimeSlot.prototype, "professional", void 0);
exports.TimeSlot = TimeSlot = __decorate([
    (0, typeorm_1.Entity)('time_slots')
], TimeSlot);
