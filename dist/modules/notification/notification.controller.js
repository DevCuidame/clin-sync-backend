"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const notification_dto_1 = require("./notification.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class NotificationController {
    notificationService;
    constructor() {
        this.notificationService = new notification_service_1.NotificationService();
    }
    async createNotification(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToClass)(notification_dto_1.CreateNotificationDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const notification = await this.notificationService.createNotification(dto);
            res.status(201).json({
                success: true,
                message: 'Notification created successfully',
                data: notification
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating notification'
            });
        }
    }
    async getNotifications(req, res) {
        try {
            const query = (0, class_transformer_1.plainToClass)(notification_dto_1.NotificationQueryDto, req.query);
            const result = await this.notificationService.getNotifications(query);
            res.status(200).json({
                success: true,
                message: 'Notifications retrieved successfully',
                data: result.notifications,
                pagination: {
                    total: result.total,
                    page: query.page || 1,
                    limit: query.limit || 10,
                    totalPages: Math.ceil(result.total / (query.limit || 10))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching notifications'
            });
        }
    }
    async getNotificationById(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID'
                });
                return;
            }
            const notification = await this.notificationService.getNotificationById(notificationId);
            if (!notification) {
                res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification retrieved successfully',
                data: notification
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching notification'
            });
        }
    }
    async updateNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID'
                });
                return;
            }
            const dto = (0, class_transformer_1.plainToClass)(notification_dto_1.UpdateNotificationDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.map(error => Object.values(error.constraints || {}).join(', '))
                });
                return;
            }
            const notification = await this.notificationService.updateNotification(notificationId, dto);
            if (!notification) {
                res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification updated successfully',
                data: notification
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error updating notification'
            });
        }
    }
    async markAsRead(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID'
                });
                return;
            }
            const notification = await this.notificationService.markAsRead(notificationId);
            if (!notification) {
                res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error marking notification as read'
            });
        }
    }
    async deleteNotification(req, res) {
        try {
            const notificationId = parseInt(req.params.id);
            if (isNaN(notificationId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid notification ID'
                });
                return;
            }
            const deleted = await this.notificationService.deleteNotification(notificationId);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error deleting notification'
            });
        }
    }
    async getUnreadCount(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid user ID'
                });
                return;
            }
            const count = await this.notificationService.getUnreadCount(userId);
            res.status(200).json({
                success: true,
                message: 'Unread count retrieved successfully',
                data: { count }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error getting unread count'
            });
        }
    }
}
exports.NotificationController = NotificationController;
