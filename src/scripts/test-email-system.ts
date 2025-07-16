/**
 * Script de prueba para verificar el funcionamiento del sistema de correos electrónicos
 * Este script envía un correo de prueba para verificar que el sistema está funcionando correctamente
 */

import { EmailService } from '../modules/notification/services/email.service';
import logger from '../utils/logger';
import config from '../core/config/environment';

/**
 * Configuración de correo de prueba
 */
interface TestEmailConfig {
  to: string;
  subject: string;
  message: string;
}

/**
 * Envía un correo de prueba para verificar el funcionamiento del sistema
 */
export async function sendTestEmail(testConfig?: Partial<TestEmailConfig>): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: any;
}> {
  try {
    logger.info('🧪 Iniciando prueba del sistema de correos electrónicos...');
    
    // Configuración por defecto
    const defaultConfig: TestEmailConfig = {
      to: testConfig?.to || 'test@ejemplo.com',
      subject: testConfig?.subject || '✅ Prueba del Sistema de Correos - ClinSync',
      message: testConfig?.message || `
        <h2>🎉 ¡Sistema de Correos Funcionando!</h2>
        <p>Este es un correo de prueba automático del sistema ClinSync.</p>
        <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-CO')}</p>
        <p><strong>Entorno:</strong> ${config.env}</p>
        <p><strong>Estado del sistema:</strong> ✅ Operativo</p>
        
        <hr>
        <h3>📋 Información del Sistema:</h3>
        <ul>
          <li>✉️ Servicio de email: Activo</li>
          <li>🔧 Configuración: Cargada correctamente</li>
          <li>📤 Envío de correos: Funcionando</li>
        </ul>
        
        <hr>
        <p><em>Este correo fue generado automáticamente por el sistema ClinSync para verificar el funcionamiento del módulo de correos electrónicos.</em></p>
      `
    };
    
    // Obtener instancia del servicio de email
    const emailService = EmailService.getInstance();
    
    // Verificar conexión antes de enviar
    logger.info('🔍 Verificando conexión al servidor de correo...');
    const connectionOk = await emailService.verifyConnection();
    
    if (!connectionOk) {
      logger.warn('⚠️ No se pudo verificar la conexión, pero intentando enviar de todas formas...');
    } else {
      logger.info('✅ Conexión al servidor de correo verificada');
    }
    
    // Enviar correo de prueba
    logger.info(`📧 Enviando correo de prueba a: ${defaultConfig.to}`);
    
    const result = await emailService.sendEmail({
      to: defaultConfig.to,
      subject: defaultConfig.subject,
      html: defaultConfig.message,
      text: 'Sistema de correos ClinSync funcionando correctamente. Fecha: ' + new Date().toLocaleString('es-CO')
    });
    
    if (result.success) {
      logger.info('✅ Correo de prueba enviado exitosamente!');
      logger.info(`📬 Message ID: ${result.messageId}`);
      
      if (result.previewUrl) {
        logger.info(`🔗 Vista previa disponible en: ${result.previewUrl}`);
      }
      
      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.previewUrl
      };
    } else {
      logger.error('❌ Error al enviar correo de prueba:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error) {
    logger.error('💥 Error crítico en la prueba del sistema de correos:', error);
    return {
      success: false,
      error
    };
  }
}

/**
 * Envía múltiples correos de prueba a diferentes direcciones
 */
export async function sendMultipleTestEmails(emails: string[]): Promise<{
  totalSent: number;
  successful: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: any; previewUrl?: string }>
}> {
  logger.info(`🧪 Enviando correos de prueba a ${emails.length} direcciones...`);
  
  const results = [];
  let successful = 0;
  let failed = 0;
  
  for (const email of emails) {
    try {
      const result = await sendTestEmail({ to: email });
      
      if (result.success) {
        successful++;
        results.push({
          email,
          success: true,
          previewUrl: result.previewUrl
        });
      } else {
        failed++;
        results.push({
          email,
          success: false,
          error: result.error
        });
      }
      
      // Pequeña pausa entre envíos para evitar spam
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      failed++;
      results.push({
        email,
        success: false,
        error
      });
    }
  }
  
  logger.info(`📊 Resumen: ${successful} exitosos, ${failed} fallidos de ${emails.length} total`);
  
  return {
    totalSent: emails.length,
    successful,
    failed,
    results
  };
}

/**
 * Función principal para ejecutar las pruebas
 */
export async function runEmailSystemTest(): Promise<void> {
  try {
    logger.info('🚀 Iniciando pruebas completas del sistema de correos...');
    
    // Prueba 1: Correo simple
    logger.info('\n📧 Prueba 1: Envío de correo simple');
    const simpleTest = await sendTestEmail();
    
    if (simpleTest.success) {
      logger.info('✅ Prueba 1 exitosa');
    } else {
      logger.error('❌ Prueba 1 falló');
    }
    
    // Prueba 2: Correo personalizado
    logger.info('\n📧 Prueba 2: Envío de correo personalizado');
    const customTest = await sendTestEmail({
      to: 'admin@cuidamehealth.com',
      subject: '🔧 Prueba Personalizada del Sistema',
      message: '<h1>Correo personalizado de prueba</h1><p>Este correo tiene contenido personalizado.</p>'
    });
    
    if (customTest.success) {
      logger.info('✅ Prueba 2 exitosa');
    } else {
      logger.error('❌ Prueba 2 falló');
    }
    
    // Prueba 3: Múltiples correos
    logger.info('\n📧 Prueba 3: Envío múltiple');
    const multipleTest = await sendMultipleTestEmails([
      'test1@ejemplo.com',
      'test2@ejemplo.com',
      'desarrollo@cuidamehealth.com'
    ]);
    
    logger.info(`✅ Prueba 3 completada: ${multipleTest.successful}/${multipleTest.totalSent} exitosos`);
    
    logger.info('\n🎉 Pruebas del sistema de correos completadas!');
    
  } catch (error) {
    logger.error('💥 Error en las pruebas del sistema de correos:', error);
  }
}

// Si el script se ejecuta directamente
if (require.main === module) {
  runEmailSystemTest()
    .then(() => {
      logger.info('🏁 Script de pruebas finalizado');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Error fatal en el script de pruebas:', error);
      process.exit(1);
    });
}