import { AppDataSource } from '../../../core/config/database';
import { Repository } from 'typeorm';
import logger from '../../../utils/logger';
import { NotFoundError } from '../../../utils/error-handler';

// Interface para la plantilla de notificación
export interface NotificationTemplate {
  id: number;
  code: string;
  name: string;
  subject: string;
  body: string;
  variables?: string; // JSON string con variables disponibles
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interface para el resultado del renderizado
export interface RenderedTemplate {
  subject: string;
  body: string;
}

export class NotificationTemplateService {
  private templateRepository: Repository<any>;

  constructor() {
    // Nota: Asumiendo que existe una entidad NotificationTemplate
    // Si no existe, necesitarás crearla o ajustar esto según tu esquema de BD
    this.templateRepository = AppDataSource.getRepository('notification_template');
  }

  /**
   * Obtener plantilla por código
   * @param code Código de la plantilla
   * @returns Plantilla de notificación
   */
  async getTemplateByCode(code: string): Promise<NotificationTemplate | null> {
    try {
      const template = await this.templateRepository.findOne({
        where: { code, active: true }
      });
      return template;
    } catch (error) {
      logger.error(`Error al obtener plantilla con código ${code}:`, error);
      return null;
    }
  }

  /**
   * Renderizar plantilla con variables
   * @param code Código de la plantilla
   * @param variables Variables para reemplazar en la plantilla
   * @returns Plantilla renderizada
   */
  async renderTemplate(code: string, variables: Record<string, any>): Promise<RenderedTemplate> {
    const template = await this.getTemplateByCode(code);
    
    if (!template) {
      throw new NotFoundError(`Plantilla con código '${code}' no encontrada`);
    }

    // Renderizar subject y body reemplazando variables
    const renderedSubject = this.replaceVariables(template.subject, variables);
    const renderedBody = this.replaceVariables(template.body, variables);

    return {
      subject: renderedSubject,
      body: renderedBody
    };
  }

  /**
   * Reemplazar variables en el texto
   * @param text Texto con variables
   * @param variables Variables para reemplazar
   * @returns Texto con variables reemplazadas
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    // Reemplazar variables en formato {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    // También soportar formato {variable}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{\\s*${key}\\s*}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Crear nueva plantilla
   * @param templateData Datos de la plantilla
   * @returns Plantilla creada
   */
  async createTemplate(templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const template = this.templateRepository.create({
        ...templateData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const savedTemplate = await this.templateRepository.save(template);
      logger.info(`Plantilla creada con código: ${savedTemplate.code}`);
      
      return savedTemplate;
    } catch (error) {
      logger.error('Error al crear plantilla:', error);
      throw error;
    }
  }

  /**
   * Actualizar plantilla
   * @param id ID de la plantilla
   * @param updateData Datos a actualizar
   * @returns Plantilla actualizada
   */
  async updateTemplate(id: number, updateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      await this.templateRepository.update(id, {
        ...updateData,
        updated_at: new Date()
      });
      
      const updatedTemplate = await this.templateRepository.findOne({ where: { id } });
      
      if (!updatedTemplate) {
        throw new NotFoundError(`Plantilla con ID ${id} no encontrada`);
      }
      
      logger.info(`Plantilla actualizada con ID: ${id}`);
      return updatedTemplate;
    } catch (error) {
      logger.error(`Error al actualizar plantilla con ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener todas las plantillas activas
   * @returns Lista de plantillas activas
   */
  async getActiveTemplates(): Promise<NotificationTemplate[]> {
    try {
      return await this.templateRepository.find({
        where: { active: true },
        order: { name: 'ASC' }
      });
    } catch (error) {
      logger.error('Error al obtener plantillas activas:', error);
      throw error;
    }
  }

  /**
   * Desactivar plantilla
   * @param id ID de la plantilla
   */
  async deactivateTemplate(id: number): Promise<void> {
    try {
      await this.templateRepository.update(id, {
        active: false,
        updated_at: new Date()
      });
      
      logger.info(`Plantilla desactivada con ID: ${id}`);
    } catch (error) {
      logger.error(`Error al desactivar plantilla con ID ${id}:`, error);
      throw error;
    }
  }
}