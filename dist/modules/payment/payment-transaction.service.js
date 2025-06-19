"use strict";
/**
 * Servicio de Transacciones de Pago
 * Maneja consultas, estadísticas y operaciones relacionadas con transacciones
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransactionService = void 0;
const typeorm_1 = require("typeorm");
const payment_interface_1 = require("./payment.interface");
const logger_1 = __importDefault(require("../../utils/logger"));
const payment_transaction_model_1 = require("../../models/payment-transaction.model");
const purchase_model_1 = require("../../models/purchase.model");
const database_1 = require("../../core/config/database");
class PaymentTransactionService {
    transactionRepository;
    purchaseRepository;
    constructor() {
        this.transactionRepository =
            database_1.AppDataSource.getRepository(payment_transaction_model_1.PaymentTransaction);
        this.purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
    }
    /**
     * Obtiene el historial de pagos con filtros y paginación
     */
    async getPaymentHistory(filters) {
        try {
            const { userId, status, paymentMethod, startDate, endDate, page = 1, limit = 10, } = filters;
            const queryBuilder = this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoinAndSelect('transaction.purchase', 'purchase')
                .leftJoinAndSelect('purchase.user', 'user')
                .leftJoinAndSelect('purchase.package', 'package')
                .orderBy('transaction.created_at', 'DESC');
            // Aplicar filtros
            if (userId) {
                queryBuilder.andWhere('user.id = :userId', { userId });
            }
            if (status) {
                queryBuilder.andWhere('transaction.status = :status', { status });
            }
            if (paymentMethod) {
                queryBuilder.andWhere('transaction.paymentMethod = :paymentMethod', {
                    paymentMethod,
                });
            }
            if (startDate && endDate) {
                queryBuilder.andWhere('transaction.created_at BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                });
            }
            else if (startDate) {
                queryBuilder.andWhere('transaction.created_at >= :startDate', {
                    startDate,
                });
            }
            else if (endDate) {
                queryBuilder.andWhere('transaction.created_at <= :endDate', { endDate });
            }
            // Paginación
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
            const [transactions, total] = await queryBuilder.getManyAndCount();
            const totalPages = Math.ceil(total / limit);
            logger_1.default.info('Payment history retrieved', {
                total,
                page,
                limit,
                totalPages,
                filters,
            });
            return {
                transactions,
                total,
                page,
                limit,
                totalPages,
            };
        }
        catch (error) {
            logger_1.default.error('Error getting payment history', error);
            throw error;
        }
    }
    /**
     * Obtiene estadísticas de pagos
     */
    async getPaymentStats(filters) {
        try {
            const { startDate, endDate, currency = payment_interface_1.WompiCurrency.COP, userId, } = filters;
            const queryBuilder = this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoin('transaction.purchase', 'purchase')
                .leftJoin('purchase.user', 'user')
                .where('transaction.currency = :currency', { currency });
            // Aplicar filtros de fecha
            if (startDate && endDate) {
                queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                });
            }
            else if (startDate) {
                queryBuilder.andWhere('transaction.createdAt >= :startDate', {
                    startDate,
                });
            }
            else if (endDate) {
                queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
            }
            // Filtro por usuario
            if (userId) {
                queryBuilder.andWhere('user.id = :userId', { userId });
            }
            // Obtener estadísticas básicas
            const totalTransactions = await queryBuilder.getCount();
            const approvedTransactions = await queryBuilder
                .clone()
                .andWhere('transaction.status = :status', {
                status: payment_interface_1.WompiTransactionStatus.APPROVED,
            })
                .getCount();
            const declinedTransactions = await queryBuilder
                .clone()
                .andWhere('transaction.status IN (:...statuses)', {
                statuses: [
                    payment_interface_1.WompiTransactionStatus.DECLINED,
                    payment_interface_1.WompiTransactionStatus.ERROR,
                ],
            })
                .getCount();
            // Calcular monto total de transacciones aprobadas
            const totalAmountResult = await queryBuilder
                .clone()
                .select('SUM(transaction.amount)', 'total')
                .andWhere('transaction.status = :status', {
                status: payment_interface_1.WompiTransactionStatus.APPROVED,
            })
                .getRawOne();
            const totalAmount = parseFloat(totalAmountResult?.total || '0');
            const totalAmountInCents = Math.round(totalAmount * 100);
            // Calcular tasa de éxito
            const successRate = totalTransactions > 0
                ? (approvedTransactions / totalTransactions) * 100
                : 0;
            const stats = {
                totalTransactions,
                approvedTransactions,
                declinedTransactions,
                totalAmountInCents,
                currency,
                successRate: Math.round(successRate * 100) / 100, // Redondear a 2 decimales
                period: {
                    startDate,
                    endDate,
                },
            };
            logger_1.default.info('Payment statistics calculated', stats);
            return stats;
        }
        catch (error) {
            logger_1.default.error('Error calculating payment statistics', error);
            throw error;
        }
    }
    /**
     * Obtiene transacciones por estado
     */
    async getTransactionsByStatus(status, limit = 50) {
        try {
            const transactions = await this.transactionRepository.find({
                where: { status: (0, typeorm_1.In)([status]) },
                relations: ['purchase', 'purchase.user', 'purchase.package'],
                order: { created_at: 'DESC' },
                take: limit,
            });
            logger_1.default.info('Transactions retrieved by status', {
                status,
                count: transactions.length,
                limit,
            });
            return transactions;
        }
        catch (error) {
            logger_1.default.error('Error getting transactions by status', error);
            throw error;
        }
    }
    /**
     * Obtiene transacciones pendientes que requieren seguimiento
     */
    async getPendingTransactions(olderThanMinutes = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setMinutes(cutoffDate.getMinutes() - olderThanMinutes);
            const transactions = await this.transactionRepository.find({
                where: {
                    status: payment_transaction_model_1.TransactionStatus.PENDING,
                    created_at: (0, typeorm_1.Between)(new Date('2020-01-01'), cutoffDate),
                },
                relations: ['purchase', 'purchase.user'],
                order: { created_at: 'ASC' },
            });
            logger_1.default.info('Pending transactions retrieved', {
                count: transactions.length,
                olderThanMinutes,
            });
            return transactions;
        }
        catch (error) {
            logger_1.default.error('Error getting pending transactions', error);
            throw error;
        }
    }
    /**
     * Obtiene el resumen de transacciones por método de pago
     */
    async getPaymentMethodSummary(filters) {
        try {
            const { startDate, endDate, currency = payment_interface_1.WompiCurrency.COP, userId, } = filters;
            const queryBuilder = this.transactionRepository
                .createQueryBuilder('transaction')
                .leftJoin('transaction.purchase', 'purchase')
                .leftJoin('purchase.user', 'user')
                .where('transaction.currency = :currency', { currency });
            // Aplicar filtros
            if (startDate && endDate) {
                queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                });
            }
            if (userId) {
                queryBuilder.andWhere('user.id = :userId', { userId });
            }
            // Obtener resumen por método de pago
            const summary = await queryBuilder
                .select([
                'transaction.paymentMethod as paymentMethod',
                'COUNT(*) as totalCount',
                'SUM(CASE WHEN transaction.status = :approvedStatus THEN 1 ELSE 0 END) as approvedCount',
                'SUM(CASE WHEN transaction.status = :approvedStatus THEN transaction.amount ELSE 0 END) as totalAmount',
            ])
                .setParameter('approvedStatus', payment_interface_1.WompiTransactionStatus.APPROVED)
                .groupBy('transaction.paymentMethod')
                .getRawMany();
            const result = summary.map((item) => ({
                paymentMethod: item.paymentMethod,
                count: parseInt(item.totalCount),
                totalAmount: parseFloat(item.totalAmount || '0'),
                successRate: item.totalCount > 0
                    ? (parseInt(item.approvedCount) / parseInt(item.totalCount)) * 100
                    : 0,
            }));
            logger_1.default.info('Payment method summary calculated', {
                methodCount: result.length,
                filters,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error calculating payment method summary', error);
            throw error;
        }
    }
    /**
     * Obtiene transacciones por ID externo (Wompi)
     */
    async getTransactionByExternalId(externalTransactionId) {
        try {
            const transaction = await this.transactionRepository.findOne({
                where: { gateway_transaction_id: externalTransactionId },
                relations: ['purchase', 'purchase.user', 'purchase.package'],
            });
            if (transaction) {
                logger_1.default.info('Transaction found by external ID', {
                    externalTransactionId,
                    transactionId: transaction.transaction_id,
                });
            }
            return transaction;
        }
        catch (error) {
            logger_1.default.error('Error getting transaction by external ID', error);
            throw error;
        }
    }
    /**
     * Actualiza el estado de una transacción
     */
    async updateTransactionStatus(externalTransactionId, status, gatewayResponse) {
        try {
            const transaction = await this.getTransactionByExternalId(externalTransactionId);
            if (!transaction) {
                logger_1.default.warn('Transaction not found for status update', {
                    externalTransactionId,
                });
                return null;
            }
            transaction.status = this.mapWompiStatusToTransactionStatus(status);
            transaction.updated_at = new Date();
            if (gatewayResponse) {
                transaction.gateway_response = JSON.stringify(gatewayResponse);
            }
            const updatedTransaction = await this.transactionRepository.save(transaction);
            logger_1.default.info('Transaction status updated', {
                externalTransactionId,
                oldStatus: transaction.status,
                newStatus: status,
            });
            return updatedTransaction;
        }
        catch (error) {
            logger_1.default.error('Error updating transaction status', error);
            throw error;
        }
    }
    /**
     * Obtiene estadísticas diarias para un rango de fechas
     */
    async getDailyStats(startDate, endDate, currency = payment_interface_1.WompiCurrency.COP) {
        try {
            const queryBuilder = this.transactionRepository
                .createQueryBuilder('transaction')
                .where('transaction.currency = :currency', { currency })
                .andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
            const dailyStats = await queryBuilder
                .select([
                'DATE(transaction.createdAt) as date',
                'COUNT(*) as transactions',
                'SUM(CASE WHEN transaction.status = :approvedStatus THEN 1 ELSE 0 END) as approvedTransactions',
                'SUM(CASE WHEN transaction.status = :approvedStatus THEN transaction.amount ELSE 0 END) as totalAmount',
            ])
                .setParameter('approvedStatus', payment_interface_1.WompiTransactionStatus.APPROVED)
                .groupBy('DATE(transaction.createdAt)')
                .orderBy('date', 'ASC')
                .getRawMany();
            const result = dailyStats.map((item) => ({
                date: item.date,
                transactions: parseInt(item.transactions),
                approvedTransactions: parseInt(item.approvedTransactions || '0'),
                totalAmount: parseFloat(item.totalAmount || '0'),
                successRate: item.transactions > 0
                    ? (parseInt(item.approvedTransactions || '0') /
                        parseInt(item.transactions)) *
                        100
                    : 0,
            }));
            logger_1.default.info('Daily statistics calculated', {
                days: result.length,
                startDate,
                endDate,
                currency,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error calculating daily statistics', error);
            throw error;
        }
    }
    /**
     * Mapea el estado de Wompi al estado de transacción interno
     */
    mapWompiStatusToTransactionStatus(wompiStatus) {
        switch (wompiStatus) {
            case payment_interface_1.WompiTransactionStatus.APPROVED:
                return payment_transaction_model_1.TransactionStatus.COMPLETED;
            case payment_interface_1.WompiTransactionStatus.DECLINED:
            case payment_interface_1.WompiTransactionStatus.ERROR:
                return payment_transaction_model_1.TransactionStatus.FAILED;
            case payment_interface_1.WompiTransactionStatus.VOIDED:
                return payment_transaction_model_1.TransactionStatus.REFUNDED;
            case payment_interface_1.WompiTransactionStatus.PENDING:
            default:
                return payment_transaction_model_1.TransactionStatus.PENDING;
        }
    }
}
exports.PaymentTransactionService = PaymentTransactionService;
