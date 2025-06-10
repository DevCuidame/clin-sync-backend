import crypto from 'crypto';

/**
 * Servicio para manejo de contraseñas con soporte para migración desde MD5
 */
export class PasswordService {
  // Configuración para nuevo método (PBKDF2)
  private static readonly SALT_LENGTH = 32;
  private static readonly HASH_ALGORITHM = 'sha256';
  private static readonly ITERATIONS = 10000;
  private static readonly KEY_LENGTH = 64;
  
  // Prefijos para identificar el método utilizado
  private static readonly MD5_PREFIX = 'md5:';
  private static readonly PBKDF2_PREFIX = 'pbkdf2:';

  /**
   * Genera un hash para una nueva contraseña usando el método seguro (PBKDF2)
   * @param password Contraseña en texto plano
   * @returns Hash con prefijo que identifica el método
   */
  static hashPassword(password: string): string {
    // Generar salt aleatorio
    const salt = crypto.randomBytes(this.SALT_LENGTH).toString('hex');
    
    // Generar hash con PBKDF2
    const hash = crypto.pbkdf2Sync(
      password, 
      salt, 
      this.ITERATIONS, 
      this.KEY_LENGTH, 
      this.HASH_ALGORITHM
    ).toString('hex');
    
    // Devolver con prefijo para identificar método
    return `${this.PBKDF2_PREFIX}${salt}:${hash}`;
  }

  /**
   * Genera un hash MD5 para compatibilidad con el método antiguo
   * @param password Contraseña en texto plano
   * @returns Hash MD5 con prefijo que identifica el método
   * @deprecated Solo para compatibilidad
   */
  static hashPasswordMD5(password: string): string {
    const hash = crypto
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
  static verifyPassword(password: string, storedHash: string): boolean {
    // Determinar el método según el prefijo
    if (storedHash.startsWith(this.PBKDF2_PREFIX)) {
      // Método PBKDF2 (nuevo)
      const hashContent = storedHash.substring(this.PBKDF2_PREFIX.length);
      const [salt, originalHash] = hashContent.split(':');
      
      if (!salt || !originalHash) return false;
      
      const hash = crypto.pbkdf2Sync(
        password, 
        salt, 
        this.ITERATIONS, 
        this.KEY_LENGTH, 
        this.HASH_ALGORITHM
      ).toString('hex');
      
      return hash === originalHash;
    } 
    else if (storedHash.startsWith(this.MD5_PREFIX)) {
      // Método MD5 (antiguo) con prefijo
      const originalHash = storedHash.substring(this.MD5_PREFIX.length);
      const hash = crypto.createHash("md5").update(password).digest("hex");
      return hash === originalHash;
    } 
    else {
      // Asumir MD5 sin prefijo (para usuarios existentes)
      const hash = crypto.createHash("md5").update(password).digest("hex");
      return hash === storedHash;
    }
  }

  /**
   * Determina si un hash necesita ser actualizado al nuevo método
   * @param hash Hash almacenado
   * @returns true si debe actualizarse, false si ya está en formato actual
   */
  static needsUpgrade(hash: string): boolean {
    return !hash.startsWith(this.PBKDF2_PREFIX);
  }
}