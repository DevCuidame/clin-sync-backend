"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const database_1 = require("../../core/config/database");
const notification_model_1 = require("../../models/notification.model");
const error_handler_1 = require("../../utils/error-handler");
class NotificationService {
    notificationRepository;
    constructor() {
        this.notificationRepository = database_1.AppDataSource.getRepository(notification_model_1.Notification);
    }
    async createNotification(data) {
        try {
            // Validaciones
            if (!data.title || data.title.trim().length === 0) {
                throw new error_handler_1.ValidationError('Title is required and cannot be empty');
            }
            if (!data.message || data.message.trim().length === 0) {
                throw new error_handler_1.ValidationError('Message is required and cannot be empty');
            }
            let scheduledFor;
            if (data.scheduled_for) {
                scheduledFor = new Date(data.scheduled_for);
                if (isNaN(scheduledFor.getTime())) {
                    throw new error_handler_1.ValidationError('Invalid date format for scheduled_for');
                }
                if (scheduledFor <= new Date()) {
                    throw new error_handler_1.BadRequestError('Cannot schedule notifications in the past');
                }
            }
            const notification = this.notificationRepository.create({
                ...data,
                scheduled_for: scheduledFor,
                status: notification_model_1.NotificationStatus.PENDING
            });
            return await this.notificationRepository.save(notification);
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error creating notification');
        }
    }
    async getNotifications(query) {
        try {
            const { user_id, type, status, page = 1, limit = 10 } = query;
            const skip = (page - 1) * limit;
            const queryBuilder = this.notificationRepository.createQueryBuilder('notification');
            if (user_id) {
                queryBuilder.andWhere('notification.user_id = :user_id', { user_id });
            }
            if (type) {
                queryBuilder.andWhere('notification.type = :type', { type });
            }
            if (status) {
                queryBuilder.andWhere('notification.status = :status', { status });
            }
            queryBuilder
                .orderBy('notification.created_at', 'DESC')
                .skip(skip)
                .take(limit);
            const [notifications, total] = await queryBuilder.getManyAndCount();
            return { notifications, total };
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching notifications');
        }
    }
    async getNotificationById(notificationId) {
        try {
            return await this.notificationRepository.findOne({
                where: { notification_id: notificationId }
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching notification');
        }
    }
    async updateNotification(notificationId, data) {
        try {
            const notification = await this.getNotificationById(notificationId);
            if (!notification) {
                throw new error_handler_1.NotFoundError('Notification not found');
            }
            const updateData = {
                ...data,
                sent_at: data.sent_at ? new Date(data.sent_at) : undefined
            };
            await this.notificationRepository.update(notificationId, updateData);
            return await this.getNotificationById(notificationId);
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error updating notification');
        }
    }
    async markAsRead(notificationId) {
        try {
            return await this.updateNotification(notificationId, {
                status: notification_model_1.NotificationStatus.READ
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error marking notification as read');
        }
    }
    async markAsSent(notificationId) {
        try {
            return await this.updateNotification(notificationId, {
                status: notification_model_1.NotificationStatus.SENT,
                sent_at: new Date().toISOString()
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error marking notification as sent');
        }
    }
    async deleteNotification(notificationId) {
        try {
            const result = await this.notificationRepository.delete(notificationId);
            return result.affected ? result.affected > 0 : false;
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error deleting notification');
        }
    }
    async getPendingNotifications() {
        try {
            return await this.notificationRepository.find({
                where: {
                    status: notification_model_1.NotificationStatus.PENDING,
                },
                order: { scheduled_for: 'ASC' }
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error fetching pending notifications');
        }
    }
    async getUnreadCount(userId) {
        try {
            return await this.notificationRepository.count({
                where: {
                    user_id: userId,
                    status: notification_model_1.NotificationStatus.PENDING
                }
            });
        }
        catch (error) {
            if (error instanceof error_handler_1.AppError) {
                throw error;
            }
            throw new error_handler_1.InternalServerError('Error getting unread count');
        }
    }
}
exports.NotificationService = NotificationService;
