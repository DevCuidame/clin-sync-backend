import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './notification.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const dto = plainToClass(CreateNotificationDto, req.body);
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error creating notification'
      });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const query = plainToClass(NotificationQueryDto, req.query);
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching notifications'
      });
    }
  }

  async getNotificationById(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error fetching notification'
      });
    }
  }

  async updateNotification(req: Request, res: Response): Promise<void> {
    try {
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid notification ID'
        });
        return;
      }

      const dto = plainToClass(UpdateNotificationDto, req.body);
      const errors = await validate(dto);

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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error updating notification'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error marking notification as read'
      });
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error deleting notification'
      });
    }
  }

  async getUnreadCount(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error getting unread count'
      });
    }
  }
}