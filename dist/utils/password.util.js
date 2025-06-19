"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Servicio para manejo de contraseñas con soporte para migración desde MD5
 */
class PasswordService {
    // Configuración para nuevo método (PBKDF2)
    static SALT_LENGTH = 32;
    static HASH_ALGORITHM = 'sha256';
    static ITERATIONS = 10000;
    static KEY_LENGTH = 64;
    // Prefijos para identificar el método utilizado
    static MD5_PREFIX = 'md5:';
    static PBKDF2_PREFIX = 'pbkdf2:';
    /**
     * Genera un hash para una nueva contraseña usando el método seguro (PBKDF2)
     * @param password Contraseña en texto plano
     * @returns Hash con prefijo que identifica el método
     */
    static hashPassword(password) {
        // Generar salt aleatorio
        const salt = crypto_1.default.randomBytes(this.SALT_LENGTH).toString('hex');
        // Generar hash con PBKDF2
        const hash = crypto_1.default.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, this.HASH_ALGORITHM).toString('hex');
        // Devolver con prefijo para identificar método
        return `${this.PBKDF2_PREFIX}${salt}:${hash}`;
    }
    /**
     * Genera un hash MD5 para compatibilidad con el método antiguo
     * @param password Contraseña en texto plano
     * @returns Hash MD5 con prefijo que identifica el método
     * @deprecated Solo para compatibilidad
     */
    static hashPasswordMD5(password) {
        const hash = crypto_1.default
            .createHash("md5")
            .update(password)
            .digest("hex");
        return `${this.MD5_PREFIX}${hash}`;
    }
    /**
     * Verifica una contraseña contra un hash almacenado
     * Detecta automáticamente el método utilizado (MD5 o PBKDF2)
     * @param password Contraseña en texto plano
     * @param storedHash Hash almacenado (con o sin prefijo)
     * @returns true si coincide, false en caso contrario
     */
    static verifyPassword(password, storedHash) {
        // Determinar el método según el prefijo
        if (storedHash.startsWith(this.PBKDF2_PREFIX)) {
            // Método PBKDF2 (nuevo)
            const hashContent = storedHash.substring(this.PBKDF2_PREFIX.length);
            const [salt, originalHash] = hashContent.split(':');
            if (!salt || !originalHash)
                return false;
            const hash = crypto_1.default.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, this.HASH_ALGORITHM).toString('hex');
            return hash === originalHash;
        }
        else if (storedHash.startsWith(this.MD5_PREFIX)) {
            // Método MD5 (antiguo) con prefijo
            const originalHash = storedHash.substring(this.MD5_PREFIX.length);
            const hash = crypto_1.default.createHash("md5").update(password).digest("hex");
            return hash === originalHash;
        }
        else {
            // Asumir MD5 sin prefijo (para usuarios existentes)
            const hash = crypto_1.default.createHash("md5").update(password).digest("hex");
            return hash === storedHash;
        }
    }
    /**
     * Determina si un hash necesita ser actualizado al nuevo método
     * @param hash Hash almacenado
     * @returns true si debe actualizarse, false si ya está en formato actual
     */
    static needsUpgrade(hash) {
        return !hash.startsWith(this.PBKDF2_PREFIX);
    }
}
exports.PasswordService = PasswordService;
