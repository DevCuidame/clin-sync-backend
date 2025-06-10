import { Repository } from 'typeorm';
import { AppDataSource } from '../../core/config/database';
import { Notification, NotificationStatus } from '../../models/notification.model';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from './notification.dto';
import { AppError, BadRequestError, InternalServerError, NotFoundError, ValidationError} from '../../utils/error-handler';

export class NotificationService {
  private notificationRepository: Repository<Notification>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    try {
      // Validaciones
      if (!data.title || data.title.trim().length === 0) {
        throw new ValidationError('Title is required and cannot be empty');
      }

      if (!data.message || data.message.trim().length === 0) {
        throw new ValidationError('Message is required and cannot be empty');
      }

      let scheduledFor: Date | undefined;
      if (data.scheduled_for) {
        scheduledFor = new Date(data.scheduled_for);
        if (isNaN(scheduledFor.getTime())) {
          throw new ValidationError('Invalid date format for scheduled_for');
        }
        if (scheduledFor <= new Date()) {
          throw new BadRequestError('Cannot schedule notifications in the past');
        }
      }

      const notification = this.notificationRepository.create({
        ...data,
        scheduled_for: scheduledFor,
        status: NotificationStatus.PENDING
      });

      return await this.notificationRepository.save(notification);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error creating notification');
    }
  }

  async getNotifications(query: NotificationQueryDto): Promise<{ notifications: Notification[], total: number }> {
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching notifications');
    }
  }

  async getNotificationById(notificationId: number): Promise<Notification | null> {
    try {
      return await this.notificationRepository.findOne({
        where: { notification_id: notificationId }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching notification');
    }
  }

  async updateNotification(notificationId: number, data: UpdateNotificationDto): Promise<Notification | null> {
    try {
      const notification = await this.getNotificationById(notificationId);
      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      const updateData = {
        ...data,
        sent_at: data.sent_at ? new Date(data.sent_at) : undefined
      };

      await this.notificationRepository.update(notificationId, updateData);
      return await this.getNotificationById(notificationId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error updating notification');
    }
  }

  async markAsRead(notificationId: number): Promise<Notification | null> {
    try {
      return await this.updateNotification(notificationId, {
        status: NotificationStatus.READ
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error marking notification as read');
    }
  }

  async markAsSent(notificationId: number): Promise<Notification | null> {
    try {
      return await this.updateNotification(notificationId, {
        status: NotificationStatus.SENT,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error marking notification as sent');
    }
  }

  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const result = await this.notificationRepository.delete(notificationId);
      return result.affected ? result.affected > 0 : false;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error deleting notification');
    }
  }

  async getPendingNotifications(): Promise<Notification[]> {
    try {
      return await this.notificationRepository.find({
        where: { 
          status: NotificationStatus.PENDING,
        },
        order: { scheduled_for: 'ASC' }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error fetching pending notifications');
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: {
          user_id: userId,
          status: NotificationStatus.PENDING
        }
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Error getting unread count');
    }
  }
}