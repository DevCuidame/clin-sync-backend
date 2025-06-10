import fs from 'fs/promises';
import path from 'path';
import logger from '../../../utils/logger';
import { NotFoundError } from '../../../utils/error-handler';

export class TemplateFileService {
  private templatesPath: string;

  constructor() {
    // Ruta donde se almacenan las plantillas de archivos
    this.templatesPath = path.join(process.cwd(), 'src', 'templates');
  }

  /**
   * Renderizar plantilla desde archivo
   * @param templateName Nombre de la plantilla (sin extensión)
   * @param variables Variables para reemplazar en la plantilla
   * @returns HTML renderizado
   */
  async renderTemplate(templateName: string, variables: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      // Verificar si el archivo existe
      await this.checkFileExists(templatePath);
      
      // Leer el contenido del archivo
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Renderizar la plantilla con las variables
      const renderedContent = this.replaceVariables(templateContent, variables);
      
      logger.info(`Plantilla '${templateName}' renderizada exitosamente`);
      return renderedContent;
    } catch (error) {
      logger.error(`Error al renderizar plantilla '${templateName}':`, error);
      throw new NotFoundError(`No se pudo cargar la plantilla '${templateName}'`);
    }
  }

  /**
   * Obtener contenido de plantilla sin renderizar
   * @param templateName Nombre de la plantilla
   * @returns Contenido crudo de la plantilla
   */
  async getTemplateContent(templateName: string): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      await this.checkFileExists(templatePath);
      
      const content = await fs.readFile(templatePath, 'utf-8');
      return content;
    } catch (error) {
      logger.error(`Error al obtener contenido de plantilla '${templateName}':`, error);
      throw new NotFoundError(`Plantilla '${templateName}' no encontrada`);
    }
  }

  /**
   * Verificar si una plantilla existe
   * @param templateName Nombre de la plantilla
   * @returns true si existe, false si no
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      await this.checkFileExists(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Listar todas las plantillas disponibles
   * @returns Array con nombres de plantillas disponibles
   */
  async listTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesPath);
      
      // Filtrar solo archivos .html y remover la extensión
      const templates = files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
      
      return templates;
    } catch (error) {
      logger.error('Error al listar plantillas:', error);
      return [];
    }
  }

  /**
   * Crear nueva plantilla desde contenido
   * @param templateName Nombre de la plantilla
   * @param content Contenido HTML de la plantilla
   */
  async createTemplate(templateName: string, content: string): Promise<void> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      // Crear directorio si no existe
      await fs.mkdir(this.templatesPath, { recursive: true });
      
      // Escribir el archivo
      await fs.writeFile(templatePath, content, 'utf-8');
      
      logger.info(`Plantilla '${templateName}' creada exitosamente`);
    } catch (error) {
      logger.error(`Error al crear plantilla '${templateName}':`, error);
      throw error;
    }
  }

  /**
   * Actualizar plantilla existente
   * @param templateName Nombre de la plantilla
   * @param content Nuevo contenido HTML
   */
  async updateTemplate(templateName: string, content: string): Promise<void> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      // Verificar que la plantilla existe
      await this.checkFileExists(templatePath);
      
      // Actualizar el archivo
      await fs.writeFile(templatePath, content, 'utf-8');
      
      logger.info(`Plantilla '${templateName}' actualizada exitosamente`);
    } catch (error) {
      logger.error(`Error al actualizar plantilla '${templateName}':`, error);
      throw error;
    }
  }

  /**
   * Eliminar plantilla
   * @param templateName Nombre de la plantilla
   */
  async deleteTemplate(templateName: string): Promise<void> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      
      await this.checkFileExists(templatePath);
      await fs.unlink(templatePath);
      
      logger.info(`Plantilla '${templateName}' eliminada exitosamente`);
    } catch (error) {
      logger.error(`Error al eliminar plantilla '${templateName}':`, error);
      throw error;
    }
  }

  /**
   * Reemplazar variables en el contenido de la plantilla
   * @param content Contenido de la plantilla
   * @param variables Variables para reemplazar
   * @returns Contenido con variables reemplazadas
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    
    // Reemplazar variables en formato {{variable}}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });

    // También soportar formato {variable}
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{\\s*${key}\\s*}`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });

    // Soportar formato %variable%
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`%${key}%`, 'g');
      result = result.replace(regex, String(variables[key] || ''));
    });

    return result;
  }

  /**
   * Verificar si un archivo existe
   * @param filePath Ruta del archivo
   */
  private async checkFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
  }

  /**
   * Obtener ruta completa de una plantilla
   * @param templateName Nombre de la plantilla
   * @returns Ruta completa del archivo
   */
  getTemplatePath(templateName: string): string {
    return path.join(this.templatesPath, `${templateName}.html`);
  }

  /**
   * Cambiar directorio de plantillas
   * @param newPath Nueva ruta del directorio
   */
  setTemplatesPath(newPath: string): void {
    this.templatesPath = newPath;
    logger.info(`Directorio de plantillas cambiado a: ${newPath}`);
  }
}