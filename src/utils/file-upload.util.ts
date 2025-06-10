import * as fs from 'fs';
import * as path from 'path';
import { BadRequestError } from './error-handler';
import config from '../core/config/environment';

/**
 * Clase de utilidad para el manejo de archivos e imágenes
 */
export class FileUploadService {
  /**
   * Guarda una imagen desde un string base64
   * @param base64Data String en formato base64 (data:image/jpeg;base64,...)
   * @param folder Carpeta dentro de uploads donde guardar (ej: 'patients', 'users')
   * @param subFolder Subcarpeta opcional (ej: 'patient_123')
   * @param fileName Nombre base del archivo (sin extensión)
   * @returns URL relativa del archivo guardado
   */
  static async saveBase64Image(
    base64Data: string,
    folder: string,
    subFolder?: string,
    fileName?: string
  ): Promise<string> {
    try {
      if (!base64Data || !base64Data.includes('base64,')) {
        return '';
      }
      
      // Extraer datos del base64
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new BadRequestError('Formato de base64 inválido');
      }
      
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      
      // Determinar extensión basada en el tipo MIME
      let extension = 'jpg';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
      else if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('pdf')) extension = 'pdf';
      
      // Crear carpeta base si no existe
      const baseDir = path.join(process.cwd(), config.fileUpload.path);
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
      } else {
        relativePath = `uploads/${folder}/${actualFileName}`;
      }
      
      return relativePath;
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      throw error;
    }
  }
  
  /**
   * Elimina un archivo del sistema de archivos
   * @param filePath Ruta relativa del archivo (/uploads/...)
   * @returns true si se eliminó correctamente
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (!filePath || !filePath.startsWith('/uploads/')) {
        return false;
      }
      
      // Convertir ruta relativa a absoluta
      const absolutePath = path.join(
        process.cwd(), 
        filePath.replace('/uploads/', config.fileUpload.path + '/')
      );
      
      // Verificar si el archivo existe
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      return false;
    }
  }
}