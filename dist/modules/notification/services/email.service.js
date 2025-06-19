"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// src/modules/notification/services/email.service.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const environment_1 = __importDefault(require("../../../core/config/environment"));
const logger_1 = __importDefault(require("../../../utils/logger"));
/**
 * Servicio para el envío de emails
 * Implementa el patrón Singleton para garantizar una única instancia
 */
class EmailService {
    transporter;
    defaultFromEmail;
    initializationPromise = null;
    // Instancia única de EmailService
    static instance = null;
    /**
     * Constructor privado para evitar crear instancias directamente
     * Use EmailService.getInstance() en su lugar
     */
    constructor() {
        this.defaultFromEmail = environment_1.default.env === 'production'
            ? environment_1.default.email.from
            : 'contacto@esmart-tek.com';
        // Inicializar el transporter pero sin esperar
        this.initializeTransporter();
        logger_1.default.debug('📧 EmailService constructor llamado');
    }
    /**
     * Método para obtener la instancia única del servicio
     */
    static getInstance() {
        if (!EmailService.instance) {
            logger_1.default.debug('📧 Creando nueva instancia de EmailService');
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    /**
     * Inicializa el transportador de email según el entorno
     */
    initializeTransporter() {
        // Si ya hay una inicialización en curso, devolver esa promesa
        if (this.initializationPromise) {
            logger_1.default.debug('📧 Reutilizando inicialización existente del transporter');
            return this.initializationPromise;
        }
        logger_1.default.debug('📧 Iniciando configuración del transporter de email');
        // Crear una nueva promesa de inicialización
        this.initializationPromise = (async () => {
            if (environment_1.default.env === 'development') {
                // Configuración para producción usando SMTP real
                logger_1.default.debug('📧 Configurando transporter para producción');
                this.transporter = nodemailer_1.default.createTransport({
                    host: environment_1.default.email.host,
                    port: environment_1.default.email.port,
                    secure: environment_1.default.email.secure,
                    auth: {
                        user: environment_1.default.email.user,
                        pass: environment_1.default.email.password,
                    },
                });
                logger_1.default.info('📧 Servicio de email configurado para producción');
            }
            else {
                // Para desarrollo, usar un servicio de prueba
                logger_1.default.debug('📧 Configurando transporter para desarrollo');
                await this.setupDevTransporter();
            }
        })();
        return this.initializationPromise;
    }
    /**
     * Configura un transporter para entorno de desarrollo
     */
    async setupDevTransporter() {
        try {
            // Crear cuenta de prueba en Ethereal
            logger_1.default.debug('📧 Creando cuenta de prueba en Ethereal');
            const testAccount = await nodemailer_1.default.createTestAccount();
            // Crear transporter usando la cuenta de prueba
            this.transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            logger_1.default.info(`📧 Servicio de email configurado para desarrollo con cuenta: ${testAccount.user}`);
        }
        catch (error) {
            logger_1.default.error('📧 Error al configurar servicio de email para desarrollo:', error);
            // Configuración fallback para desarrollo
            logger_1.default.debug('📧 Usando configuración fallback con localhost:1025');
            this.transporter = nodemailer_1.default.createTransport({
                host: 'localhost',
                port: 1025,
                secure: false,
                ignoreTLS: true,
            });
        }
    }
    /**
     * Envía un email
     * @param emailConfig Configuración del email
     * @returns Información del envío
     */
    async sendEmail(emailConfig) {
        try {
            // Asegurarse de que el transporter esté inicializado completamente
            await this.initializeTransporter();
            // Validar datos mínimos
            if (!emailConfig.to || !emailConfig.subject) {
                throw new Error('Destinatario y asunto son obligatorios');
            }
            // Si no se proporciona contenido, añadir un mensaje por defecto
            if (!emailConfig.text && !emailConfig.html) {
                emailConfig.text = 'Este es un mensaje sin contenido.';
            }
            // Configuración del email
            const mailOptions = {
                from: this.defaultFromEmail,
                to: emailConfig.to,
                cc: emailConfig.cc,
                subject: emailConfig.subject,
                text: emailConfig.text,
                html: emailConfig.html,
                attachments: emailConfig.attachments,
            };
            // Enviar email
            logger_1.default.debug(`📧 Enviando email a: ${emailConfig.to}`);
            const info = await this.transporter.sendMail(mailOptions);
            // En desarrollo, mostrar URL de vista previa
            let previewUrl;
            if (environment_1.default.env !== 'production') {
                previewUrl = nodemailer_1.default.getTestMessageUrl(info);
                logger_1.default.info(`📧 Vista previa del email: ${previewUrl}`);
            }
            return {
                success: true,
                messageId: info.messageId,
                previewUrl: previewUrl || undefined,
            };
        }
        catch (error) {
            logger_1.default.error('📧 Error al enviar email:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Genera y envía un email a partir de una plantilla HTML y datos
     * @param to Destinatario
     * @param subject Asunto
     * @param template Plantilla HTML
     * @param data Datos para la plantilla
     * @param cc Destinatarios en copia
     * @param attachments Archivos adjuntos
     * @returns Información del envío
     */
    async sendTemplatedEmail(to, subject, template, data, cc, attachments) {
        try {
            // Renderizar la plantilla con los datos
            const html = this.renderTemplate(template, data);
            // Enviar email con la plantilla renderizada
            return await this.sendEmail({
                to,
                cc,
                subject,
                html,
                attachments
            });
        }
        catch (error) {
            logger_1.default.error('📧 Error al enviar email con plantilla:', error);
            return {
                success: false,
                error
            };
        }
    }
    /**
     * Renderiza una plantilla HTML simple
     * @param template Plantilla HTML con placeholders {{variable}}
     * @param data Datos para reemplazar en la plantilla
     * @returns HTML renderizado
     */
    renderTemplate(template, data) {
        // Reemplazar placeholders en la plantilla
        let rendered = template;
        // Buscar todas las variables en la plantilla (formato {{variable}})
        const variableMatches = template.match(/{{([^}]+)}}/g);
        if (variableMatches) {
            // Eliminar duplicados
            const uniqueVariables = [...new Set(variableMatches)];
            // Reemplazar cada variable por su valor
            uniqueVariables.forEach(match => {
                const variableName = match.replace(/{{|}}/g, '');
                const value = data[variableName] !== undefined ? data[variableName] : '';
                rendered = rendered.replace(new RegExp(match, 'g'), value);
            });
        }
        return rendered;
    }
    /**
     * Verifica la conexión al servidor de email
     * @returns true si la conexión es exitosa
     */
    async verifyConnection() {
        try {
            await this.initializeTransporter();
            await this.transporter.verify();
            return true;
        }
        catch (error) {
            logger_1.default.error('📧 Error al verificar conexión SMTP:', error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
