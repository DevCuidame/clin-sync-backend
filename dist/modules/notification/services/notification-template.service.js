"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplateService = void 0;
const database_1 = require("../../../core/config/database");
const logger_1 = __importDefault(require("../../../utils/logger"));
const error_handler_1 = require("../../../utils/error-handler");
class NotificationTemplateService {
    templateRepository;
    constructor() {
        // Nota: Asumiendo que existe una entidad NotificationTemplate
        // Si no existe, necesitarás crearla o ajustar esto según tu esquema de BD
        this.templateRepository = database_1.AppDataSource.getRepository('notification_template');
    }
    /**
     * Obtener plantilla por código
     * @param code Código de la plantilla
     * @returns Plantilla de notificación
     */
    async getTemplateByCode(code) {
        try {
            const template = await this.templateRepository.findOne({
                where: { code, active: true }
            });
            return template;
        }
        catch (error) {
            logger_1.default.error(`Error al obtener plantilla con código ${code}:`, error);
            return null;
        }
    }
    /**
     * Renderizar plantilla con variables
     * @param code Código de la plantilla
     * @param variables Variables para reemplazar en la plantilla
     * @returns Plantilla renderizada
     */
    async renderTemplate(code, variables) {
        const template = await this.getTemplateByCode(code);
        if (!template) {
            throw new error_handler_1.NotFoundError(`Plantilla con código '${code}' no encontrada`);
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
    replaceVariables(text, variables) {
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
    async createTemplate(templateData) {
        try {
            const template = this.templateRepository.create({
                ...templateData,
                created_at: new Date(),
                updated_at: new Date()
            });
            const savedTemplate = await this.templateRepository.save(template);
            logger_1.default.info(`Plantilla creada con código: ${savedTemplate.code}`);
            return savedTemplate;
        }
        catch (error) {
            logger_1.default.error('Error al crear plantilla:', error);
            throw error;
        }
    }
    /**
     * Actualizar plantilla
     * @param id ID de la plantilla
     * @param updateData Datos a actualizar
     * @returns Plantilla actualizada
     */
    async updateTemplate(id, updateData) {
        try {
            await this.templateRepository.update(id, {
                ...updateData,
                updated_at: new Date()
            });
            const updatedTemplate = await this.templateRepository.findOne({ where: { id } });
            if (!updatedTemplate) {
                throw new error_handler_1.NotFoundError(`Plantilla con ID ${id} no encontrada`);
            }
            logger_1.default.info(`Plantilla actualizada con ID: ${id}`);
            return updatedTemplate;
        }
        catch (error) {
            logger_1.default.error(`Error al actualizar plantilla con ID ${id}:`, error);
            throw error;
        }
    }
    /**
     * Obtener todas las plantillas activas
     * @returns Lista de plantillas activas
     */
    async getActiveTemplates() {
        try {
            return await this.templateRepository.find({
                where: { active: true },
                order: { name: 'ASC' }
            });
        }
        catch (error) {
            logger_1.default.error('Error al obtener plantillas activas:', error);
            throw error;
        }
    }
    /**
     * Desactivar plantilla
     * @param id ID de la plantilla
     */
    async deactivateTemplate(id) {
        try {
            await this.templateRepository.update(id, {
                active: false,
                updated_at: new Date()
            });
            logger_1.default.info(`Plantilla desactivada con ID: ${id}`);
        }
        catch (error) {
            logger_1.default.error(`Error al desactivar plantilla con ID ${id}:`, error);
            throw error;
        }
    }
}
exports.NotificationTemplateService = NotificationTemplateService;
