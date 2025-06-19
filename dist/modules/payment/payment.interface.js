"use strict";
/**
 * Interfaces y DTOs para el módulo de pagos con Wompi
 * Implementación modular y escalable siguiendo clean code
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WOMPI_CONSTANTS = exports.WompiEventType = exports.WompiTransactionStatus = exports.WompiPaymentMethod = exports.WompiCurrency = void 0;
// Enums para tipos de datos
var WompiCurrency;
(function (WompiCurrency) {
    WompiCurrency["COP"] = "COP";
    WompiCurrency["USD"] = "USD";
})(WompiCurrency || (exports.WompiCurrency = WompiCurrency = {}));
var WompiPaymentMethod;
(function (WompiPaymentMethod) {
    WompiPaymentMethod["CARD"] = "CARD";
    WompiPaymentMethod["NEQUI"] = "NEQUI";
    WompiPaymentMethod["PSE"] = "PSE";
    WompiPaymentMethod["BANCOLOMBIA_TRANSFER"] = "BANCOLOMBIA_TRANSFER";
    WompiPaymentMethod["BANCOLOMBIA_COLLECT"] = "BANCOLOMBIA_COLLECT";
})(WompiPaymentMethod || (exports.WompiPaymentMethod = WompiPaymentMethod = {}));
var WompiTransactionStatus;
(function (WompiTransactionStatus) {
    WompiTransactionStatus["PENDING"] = "PENDING";
    WompiTransactionStatus["APPROVED"] = "APPROVED";
    WompiTransactionStatus["DECLINED"] = "DECLINED";
    WompiTransactionStatus["VOIDED"] = "VOIDED";
    WompiTransactionStatus["ERROR"] = "ERROR";
})(WompiTransactionStatus || (exports.WompiTransactionStatus = WompiTransactionStatus = {}));
var WompiEventType;
(function (WompiEventType) {
    WompiEventType["TRANSACTION_UPDATED"] = "transaction.updated";
    WompiEventType["PAYMENT_LINK_PAID"] = "payment_link.paid";
})(WompiEventType || (exports.WompiEventType = WompiEventType = {}));
// Constantes para configuración
exports.WOMPI_CONSTANTS = {
    SANDBOX_URL: 'https://sandbox.wompi.co/v1',
    PRODUCTION_URL: 'https://production.wompi.co/v1',
    MIN_AMOUNT_COP: 100, // $1 COP
    MAX_AMOUNT_COP: 200000000, // $500,000 COP
    MIN_AMOUNT_USD: 1, // $0.01 USD
    MAX_AMOUNT_USD: 15000, // $150 USD
    SUPPORTED_CURRENCIES: [WompiCurrency.COP, WompiCurrency.USD],
    WEBHOOK_TOLERANCE_SECONDS: 300, // 5 minutos
    DEFAULT_EXPIRATION_HOURS: 24
};
