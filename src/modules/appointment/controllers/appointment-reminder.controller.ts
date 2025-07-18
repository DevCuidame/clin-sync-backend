/**
 * Controlador para gestionar recordatorios de citas
 * Proporciona endpoints para monitorear y gestionar el sistema de recordatorios
 */

import { Request, Response } from 'express';
import { AppointmentReminderService } from '../services/appointment-reminder.service';
import { InternalServerError } from '../../../utils/error-handler';
import logger from '../../../utils/logger';

export class AppointmentReminderController {
  private reminderService: AppointmentReminderService;

  constructor() {
    this.reminderService = new AppointmentReminderService();
  }

  /**
   * Obtiene estadísticas del sistema de recordatorios
   */
  async getReminderStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.reminderService.getReminderStats();
      
      res.status(200).json({
        success: true,
        data: {
          pending24hReminders: stats.pending24h,
          pending2hReminders: stats.pending2h,
          scheduledJobs: stats.scheduledJobs,
          timestamp: new Date().toISOString()
        },
        message: 'Reminder statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error getting reminder stats:', error);
      res.status(400).json({
        success: false,
        message: 'Error retrieving reminder statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Procesa recordatorios pendientes manualmente
   */
  async processReminders(req: Request, res: Response): Promise<void> {
    try {
      await this.reminderService.processReminders();
      
      res.status(200).json({
        success: true,
        message: 'Reminders processed successfully'
      });
    } catch (error) {
      logger.error('Error processing reminders:', error);
      res.status(400).json({
        success: false,
        message: 'Error processing reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Programa un recordatorio específico para una cita
   */
  async scheduleReminder(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const { reminderType } = req.body;

      if (!appointmentId || !reminderType) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID and reminder type are required'
        });
        return;
      }

      if (!['24h', '2h'].includes(reminderType)) {
        res.status(400).json({
          success: false,
          message: 'Reminder type must be either "24h" or "2h"'
        });
        return;
      }

      await this.reminderService.scheduleReminder(
        parseInt(appointmentId), 
        reminderType as '24h' | '2h'
      );
      
      res.status(200).json({
        success: true,
        message: `${reminderType} reminder scheduled successfully for appointment ${appointmentId}`
      });
    } catch (error) {
      logger.error('Error scheduling reminder:', error);
      res.status(400).json({
        success: false,
        message: 'Error scheduling reminder',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cancela los recordatorios de una cita específica
   */
  async cancelReminders(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(400).json({
          success: false,
          message: 'Appointment ID is required'
        });
        return;
      }

      await this.reminderService.cancelReminders(parseInt(appointmentId));
      
      res.status(200).json({
        success: true,
        message: `Reminders cancelled successfully for appointment ${appointmentId}`
      });
    } catch (error) {
      logger.error('Error cancelling reminders:', error);
      res.status(400).json({
        success: false,
        message: 'Error cancelling reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Endpoint de salud para verificar el estado del sistema de recordatorios
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.reminderService.getReminderStats();
      
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          reminderService: 'running',
          stats,
          timestamp: new Date().toISOString()
        },
        message: 'Reminder service is healthy'
      });
    } catch (error) {
      logger.error('Error in reminder health check:', error);
      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          reminderService: 'error',
          timestamp: new Date().toISOString()
        },
        message: 'Reminder service is experiencing issues'
      });
    }
  }
}

// Instancia singleton del controlador
export const appointmentReminderController = new AppointmentReminderController();