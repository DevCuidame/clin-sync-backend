"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateFileService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const error_handler_1 = require("../../../utils/error-handler");
class TemplateFileService {
    templatesPath;
    constructor() {
        // Ruta donde se almacenan las plantillas de archivos
        this.templatesPath = path_1.default.join(process.cwd(), 'src', 'templates');
    }
    /**
     * Renderizar plantilla desde archivo
     * @param templateName Nombre de la plantilla (sin extensión)
     * @param variables Variables para reemplazar en la plantilla
     * @returns HTML renderizado
     */
    async renderTemplate(templateName, variables) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            // Verificar si el archivo existe
            await this.checkFileExists(templatePath);
            // Leer el contenido del archivo
            const templateContent = await promises_1.default.readFile(templatePath, 'utf-8');
            // Renderizar la plantilla con las variables
            const renderedContent = this.replaceVariables(templateContent, variables);
            logger_1.default.info(`Plantilla '${templateName}' renderizada exitosamente`);
            return renderedContent;
        }
        catch (error) {
            logger_1.default.error(`Error al renderizar plantilla '${templateName}':`, error);
            throw new error_handler_1.NotFoundError(`No se pudo cargar la plantilla '${templateName}'`);
        }
    }
    /**
     * Obtener contenido de plantilla sin renderizar
     * @param templateName Nombre de la plantilla
     * @returns Contenido crudo de la plantilla
     */
    async getTemplateContent(templateName) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            await this.checkFileExists(templatePath);
            const content = await promises_1.default.readFile(templatePath, 'utf-8');
            return content;
        }
        catch (error) {
            logger_1.default.error(`Error al obtener contenido de plantilla '${templateName}':`, error);
            throw new error_handler_1.NotFoundError(`Plantilla '${templateName}' no encontrada`);
        }
    }
    /**
     * Verificar si una plantilla existe
     * @param templateName Nombre de la plantilla
     * @returns true si existe, false si no
     */
    async templateExists(templateName) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            await this.checkFileExists(templatePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Listar todas las plantillas disponibles
     * @returns Array con nombres de plantillas disponibles
     */
    async listTemplates() {
        try {
            const files = await promises_1.default.readdir(this.templatesPath);
            // Filtrar solo archivos .html y remover la extensión
            const templates = files
                .filter(file => file.endsWith('.html'))
                .map(file => file.replace('.html', ''));
            return templates;
        }
        catch (error) {
            logger_1.default.error('Error al listar plantillas:', error);
            return [];
        }
    }
    /**
     * Crear nueva plantilla desde contenido
     * @param templateName Nombre de la plantilla
     * @param content Contenido HTML de la plantilla
     */
    async createTemplate(templateName, content) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            // Crear directorio si no existe
            await promises_1.default.mkdir(this.templatesPath, { recursive: true });
            // Escribir el archivo
            await promises_1.default.writeFile(templatePath, content, 'utf-8');
            logger_1.default.info(`Plantilla '${templateName}' creada exitosamente`);
        }
        catch (error) {
            logger_1.default.error(`Error al crear plantilla '${templateName}':`, error);
            throw error;
        }
    }
    /**
     * Actualizar plantilla existente
     * @param templateName Nombre de la plantilla
     * @param content Nuevo contenido HTML
     */
    async updateTemplate(templateName, content) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            // Verificar que la plantilla existe
            await this.checkFileExists(templatePath);
            // Actualizar el archivo
            await promises_1.default.writeFile(templatePath, content, 'utf-8');
            logger_1.default.info(`Plantilla '${templateName}' actualizada exitosamente`);
        }
        catch (error) {
            logger_1.default.error(`Error al actualizar plantilla '${templateName}':`, error);
            throw error;
        }
    }
    /**
     * Eliminar plantilla
     * @param templateName Nombre de la plantilla
     */
    async deleteTemplate(templateName) {
        try {
            const templatePath = path_1.default.join(this.templatesPath, `${templateName}.html`);
            await this.checkFileExists(templatePath);
            await promises_1.default.unlink(templatePath);
            logger_1.default.info(`Plantilla '${templateName}' eliminada exitosamente`);
        }
        catch (error) {
            logger_1.default.error(`Error al eliminar plantilla '${templateName}':`, error);
            throw error;
        }
    }
    /**
     * Reemplazar variables en el contenido de la plantilla
     * @param content Contenido de la plantilla
     * @param variables Variables para reemplazar
     * @returns Contenido con variables reemplazadas
     */
    replaceVariables(content, variables) {
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
    async checkFileExists(filePath) {
        try {
            await promises_1.default.access(filePath);
        }
        catch {
            throw new Error(`Archivo no encontrado: ${filePath}`);
        }
    }
    /**
     * Obtener ruta completa de una plantilla
     * @param templateName Nombre de la plantilla
     * @returns Ruta completa del archivo
     */
    getTemplatePath(templateName) {
        return path_1.default.join(this.templatesPath, `${templateName}.html`);
    }
    /**
     * Cambiar directorio de plantillas
     * @param newPath Nueva ruta del directorio
     */
    setTemplatesPath(newPath) {
        this.templatesPath = newPath;
        logger_1.default.info(`Directorio de plantillas cambiado a: ${newPath}`);
    }
}
exports.TemplateFileService = TemplateFileService;
