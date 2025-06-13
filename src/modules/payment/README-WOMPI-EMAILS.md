# Sistema de Correos para Wompi

Este documento describe el sistema de correos implementado para manejar las notificaciones relacionadas con transacciones de Wompi de manera reutilizable, limpia y fácil de usar.

## 📋 Características

- ✅ **Reutilizable**: Servicio singleton que puede ser usado en cualquier parte del sistema
- ✅ **Limpio**: Código bien estructurado siguiendo principios SOLID
- ✅ **Fácil de usar**: API simple e intuitiva
- ✅ **Plantillas HTML**: Templates responsivos y profesionales
- ✅ **Manejo de errores**: Gestión robusta de errores y logging
- ✅ **Tipado fuerte**: Interfaces TypeScript bien definidas
- ✅ **Formateo automático**: Montos, fechas y estados formateados automáticamente

## 🏗️ Arquitectura

### Componentes Principales

1. **WompiEmailService**: Servicio principal para envío de correos
2. **Plantillas HTML**: Templates para diferentes tipos de notificaciones
3. **Interfaces**: Definiciones de tipos para datos de correo
4. **Ejemplos de uso**: Implementaciones de referencia

### Estructura de Archivos

```
src/
├── modules/payment/
│   ├── services/
│   │   └── wompi-email.service.ts     # Servicio principal
│   ├── examples/
│   │   └── wompi-email-usage.ts       # Ejemplos de uso
│   └── README-WOMPI-EMAILS.md         # Esta documentación
├── templates/
│   ├── wompi-payment-confirmation.html # Plantilla de confirmación
│   ├── wompi-payment-failure.html     # Plantilla de pago fallido
│   ├── wompi-payment-pending.html     # Plantilla de pago pendiente
│   └── wompi-refund-notification.html # Plantilla de reembolso
```

## 🚀 Uso Básico

### 1. Importar el Servicio

```typescript
import { WompiEmailService, WompiEmailData } from '../services/wompi-email.service';
import { WompiTransactionStatus } from '../payment.interface';
```

### 2. Obtener Instancia del Servicio

```typescript
const emailService = WompiEmailService.getInstance();
```

### 3. Preparar Datos del Correo

```typescript
const emailData: WompiEmailData = {
  customerName: 'Juan Pérez',
  customerEmail: 'juan@ejemplo.com',
  transactionId: 'txn_12345',
  reference: 'REF-2024-001',
  amount: 50000, // En centavos
  currency: 'COP',
  status: WompiTransactionStatus.APPROVED,
  paymentMethod: 'CARD',
  transactionDate: new Date(),
  packageName: 'Consulta Médica',
  companyName: 'Cuidame Health',
  supportEmail: 'soporte@cuidamehealth.com',
  supportPhone: '+57 300 123 4567'
};
```

### 4. Enviar Correo

```typescript
// Envío automático basado en estado
const result = await emailService.sendTransactionStatusEmail(emailData);

// O envío específico
const result = await emailService.sendPaymentConfirmation(emailData);
```

## 📧 Tipos de Correos Disponibles

### 1. Confirmación de Pago (APPROVED)
- **Método**: `sendPaymentConfirmation()`
- **Plantilla**: `wompi-payment-confirmation.html`
- **Uso**: Cuando un pago es exitoso

### 2. Pago Fallido (DECLINED/ERROR)
- **Método**: `sendPaymentFailure()`
- **Plantilla**: `wompi-payment-failure.html`
- **Uso**: Cuando un pago es rechazado o falla

### 3. Pago Pendiente (PENDING)
- **Método**: `sendPaymentPending()`
- **Plantilla**: `wompi-payment-pending.html`
- **Uso**: Cuando un pago está en proceso

### 4. Notificación de Reembolso
- **Método**: `sendRefundNotification()`
- **Plantilla**: `wompi-refund-notification.html`
- **Uso**: Cuando se procesa un reembolso

### 5. Envío Automático
- **Método**: `sendTransactionStatusEmail()`
- **Uso**: Detecta automáticamente el tipo de correo según el estado

## 🔧 Configuración

### Variables de Entorno Requeridas

El sistema utiliza la configuración de correo existente del proyecto:

```env
# Configuración de correo (ya existente)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password
EMAIL_FROM=noreply@cuidamehealth.com
```

### Personalización de Plantillas

Las plantillas HTML están ubicadas en `src/templates/` y pueden ser personalizadas:

- Colores y estilos CSS
- Logos y branding
- Textos y mensajes
- Información de contacto

## 📝 Ejemplos de Implementación

### Integración con Webhooks de Wompi

```typescript
export async function handleWompiWebhook(webhookData: any) {
  const emailService = WompiEmailService.getInstance();
  const transaction = webhookData.data.transaction;
  
  const emailData: WompiEmailData = {
    customerName: transaction.customer_data?.full_name || 'Cliente',
    customerEmail: transaction.customer_email,
    transactionId: transaction.id,
    reference: transaction.reference,
    amount: transaction.amount_in_cents,
    currency: transaction.currency,
    status: transaction.status,
    transactionDate: new Date(transaction.created_at)
  };
  
  await emailService.sendTransactionStatusEmail(emailData);
}
```

### Uso en Controladores

```typescript
export class PaymentController {
  private emailService = WompiEmailService.getInstance();
  
  async processPayment(paymentData: any) {
    try {
      // Procesar pago con Wompi
      const transaction = await wompiService.createTransaction(paymentData);
      
      // Enviar correo de confirmación
      await this.emailService.sendTransactionStatusEmail({
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        transactionId: transaction.id,
        reference: transaction.reference,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        transactionDate: new Date()
      });
      
      return transaction;
    } catch (error) {
      // Manejar error
    }
  }
}
```

## 🛠️ Manejo de Errores

### Estructura de Respuesta

```typescript
interface WompiEmailResult {
  success: boolean;
  messageId?: string;    // ID del mensaje enviado
  previewUrl?: string;   // URL de preview (desarrollo)
  error?: any;           // Error si falla
}
```

### Ejemplo con Manejo de Errores

```typescript
const result = await emailService.sendPaymentConfirmation(emailData);

if (result.success) {
  logger.info('Correo enviado exitosamente', {
    messageId: result.messageId,
    transactionId: emailData.transactionId
  });
} else {
  logger.error('Error al enviar correo', {
    error: result.error,
    transactionId: emailData.transactionId
  });
}
```

### Implementación con Reintentos

```typescript
async function sendEmailWithRetry(emailData: WompiEmailData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await emailService.sendTransactionStatusEmail(emailData);
    
    if (result.success) {
      return result;
    }
    
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error('Failed to send email after retries');
}
```

## 🎨 Personalización de Plantillas

### Variables Disponibles

Todas las plantillas tienen acceso a estas variables:

```typescript
{
  customerName: string;        // Nombre del cliente
  customerEmail: string;       // Email del cliente
  transactionId: string;       // ID de la transacción
  reference: string;           // Referencia de la transacción
  amount: number;              // Monto original
  formattedAmount: string;     // Monto formateado con moneda
  currency: string;            // Moneda (COP, USD)
  status: string;              // Estado de la transacción
  statusText: string;          // Texto descriptivo del estado
  paymentMethod?: string;      // Método de pago
  transactionDate: Date;       // Fecha de la transacción
  formattedDate: string;       // Fecha formateada
  packageName?: string;        // Nombre del paquete/servicio
  companyName: string;         // Nombre de la empresa
  supportEmail: string;        // Email de soporte
  supportPhone: string;        // Teléfono de soporte
}
```

### Variables Adicionales para Reembolsos

```typescript
{
  refundAmount?: number;       // Monto del reembolso
  formattedRefundAmount: string; // Monto del reembolso formateado
  refundReason?: string;       // Razón del reembolso
}
```

## 🔍 Testing

### Pruebas Unitarias

```typescript
describe('WompiEmailService', () => {
  let emailService: WompiEmailService;
  
  beforeEach(() => {
    emailService = WompiEmailService.getInstance();
  });
  
  it('should send payment confirmation email', async () => {
    const emailData: WompiEmailData = {
      // ... datos de prueba
    };
    
    const result = await emailService.sendPaymentConfirmation(emailData);
    expect(result.success).toBe(true);
  });
});
```

### Pruebas de Integración

```typescript
// Probar con datos reales en desarrollo
const testEmailData: WompiEmailData = {
  customerName: 'Test User',
  customerEmail: 'test@ejemplo.com',
  transactionId: 'test_txn_123',
  reference: 'TEST-REF-001',
  amount: 10000,
  currency: 'COP',
  status: WompiTransactionStatus.APPROVED,
  transactionDate: new Date()
};

await emailService.sendPaymentConfirmation(testEmailData);
```

## 📊 Logging y Monitoreo

El sistema incluye logging detallado:

```typescript
// Logs de éxito
logger.info('Correo de confirmación enviado', {
  transactionId: data.transactionId,
  customerEmail: data.customerEmail,
  messageId: result.messageId
});

// Logs de error
logger.error('Error al enviar correo', {
  transactionId: data.transactionId,
  error: error.message,
  stack: error.stack
});
```

## 🚀 Próximas Mejoras

- [ ] Soporte para múltiples idiomas
- [ ] Plantillas dinámicas desde base de datos
- [ ] Cola de correos para mejor rendimiento
- [ ] Métricas de entrega y apertura
- [ ] Plantillas de correo en texto plano
- [ ] Integración con servicios de email marketing

## 🤝 Contribución

Para contribuir al sistema de correos:

1. Mantén la consistencia en el estilo de código
2. Agrega tests para nuevas funcionalidades
3. Actualiza la documentación
4. Sigue los principios de diseño existentes

## 📞 Soporte

Para dudas o problemas con el sistema de correos:

- Revisa los logs del sistema
- Verifica la configuración de correo
- Consulta los ejemplos de uso
- Contacta al equipo de desarrollo