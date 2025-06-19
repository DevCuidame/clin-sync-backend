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
exports.PaymentWebhook = exports.WebhookStatus = void 0;
const typeorm_1 = require("typeorm");
const payment_transaction_model_1 = require("./payment-transaction.model");
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["RECEIVED"] = "received";
    WebhookStatus["PROCESSING"] = "processing";
    WebhookStatus["PROCESSED"] = "processed";
    WebhookStatus["FAILED"] = "failed";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
let PaymentWebhook = class PaymentWebhook {
    webhook_id;
    transaction_id;
    provider;
    event_type;
    payload;
    status;
    signature;
    received_at;
    processed_at;
    error_message;
    // Relaciones
    transaction;
};
exports.PaymentWebhook = PaymentWebhook;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], PaymentWebhook.prototype, "webhook_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentWebhook.prototype, "transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "provider", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], PaymentWebhook.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: WebhookStatus,
        default: WebhookStatus.RECEIVED
    }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "signature", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentWebhook.prototype, "received_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PaymentWebhook.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaymentWebhook.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_transaction_model_1.PaymentTransaction),
    (0, typeorm_1.JoinColumn)({ name: 'transaction_id' }),
    __metadata("design:type", payment_transaction_model_1.PaymentTransaction)
], PaymentWebhook.prototype, "transaction", void 0);
exports.PaymentWebhook = PaymentWebhook = __decorate([
    (0, typeorm_1.Entity)('payment_webhooks')
], PaymentWebhook);
