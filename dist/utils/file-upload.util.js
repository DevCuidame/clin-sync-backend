"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const error_handler_1 = require("./error-handler");
const environment_1 = __importDefault(require("../core/config/environment"));
/**
 * Clase de utilidad para el manejo de archivos e imágenes
 */
class FileUploadService {
    /**
     * Guarda una imagen desde un string base64
     * @param base64Data String en formato base64 (data:image/jpeg;base64,...)
     * @param folder Carpeta dentro de uploads donde guardar (ej: 'patients', 'users')
     * @param subFolder Subcarpeta opcional (ej: 'patient_123')
     * @param fileName Nombre base del archivo (sin extensión)
     * @returns URL relativa del archivo guardado
     */
    static async saveBase64Image(base64Data, folder, subFolder, fileName) {
        try {
            if (!base64Data || !base64Data.includes('base64,')) {
                return '';
            }
            // Extraer datos del base64
            const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new error_handler_1.BadRequestError('Formato de base64 inválido');
            }
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            // Determinar extensión basada en el tipo MIME
            let extension = 'jpg';
            if (mimeType.includes('jpeg') || mimeType.includes('jpg'))
                extension = 'jpg';
            else if (mimeType.includes('png'))
                extension = 'png';
            else if (mimeType.includes('gif'))
                extension = 'gif';
            else if (mimeType.includes('pdf'))
                extension = 'pdf';
            // Crear carpeta base si no existe
            const baseDir = path.isAbsolute(environment_1.default.fileUpload.path)
                ? environment_1.default.fileUpload.path
                : path.join(process.cwd(), environment_1.default.fileUpload.path);
            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }
            // Crear carpeta de categoría si no existe
            const categoryDir = path.join(baseDir, folder);
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }
            // Crear carpeta específica (opcional) si no existe
            let targetDir = categoryDir;
            if (subFolder) {
                targetDir = path.join(categoryDir, subFolder);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
            }
            // Generar nombre de archivo
            const actualFileName = `${fileName || 'file'}_${Date.now()}.${extension}`;
            const filePath = path.join(targetDir, actualFileName);
            // Guardar archivo
            fs.writeFileSync(filePath, buffer);
            // Construir URL relativa
            let relativePath = '';
            if (subFolder) {
                relativePath = `uploads/${folder}/${subFolder}/${actualFileName}`;
            }
            else {
                relativePath = `uploads/${folder}/${actualFileName}`;
            }
            return relativePath;
        }
        catch (error) {
            console.error('Error al guardar imagen:', error);
            throw error;
        }
    }
    /**
     * Elimina un archivo del sistema de archivos
     * @param filePath Ruta relativa del archivo (/uploads/...)
     * @returns true si se eliminó correctamente
     */
    static async deleteFile(filePath) {
        try {
            if (!filePath || !filePath.startsWith('/uploads/')) {
                return false;
            }
            // Convertir ruta relativa a absoluta
            const absolutePath = path.isAbsolute(environment_1.default.fileUpload.path)
                ? filePath.replace('/uploads/', environment_1.default.fileUpload.path + '/')
                : path.join(process.cwd(), filePath.replace('/uploads/', environment_1.default.fileUpload.path + '/'));
            // Verificar si el archivo existe
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error al eliminar archivo:', error);
            return false;
        }
    }
}
exports.FileUploadService = FileUploadService;
