# Mejoras para el Manejo de Errores 422 de Wompi

## Resumen de Cambios Implementados

Este documento describe las mejoras implementadas para manejar mejor los errores 422 (INPUT_VALIDATION_ERROR) de la API de Wompi.

## Cambios Realizados

### 1. Mejora en la Generación de Referencias

**Problema**: Las referencias duplicadas pueden causar errores 422.

**Solución**: Se mejoró la generación de referencias para hacerlas más únicas:

```typescript
// Antes
reference: `TXN-${Date.now()}-${userId}`

// Después
reference: `TXN-${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`
```

**Archivos modificados**:
- `payment.controller.ts` (línea ~77)
- `wompi.service.ts` (línea ~170)

### 2. Manejo Mejorado de Errores de Validación

**Problema**: Los errores 422 no proporcionaban información específica sobre qué campos fallaron.

**Solución**: Se agregó el campo `validationErrors` a la interfaz `PaymentResponseDto`:

```typescript
export interface PaymentResponseDto {
  // ... otros campos
  validationErrors?: any;
}
```

**Archivos modificados**:
- `payment.interface.ts`
- `wompi.service.ts` (método `handleWompiError`)

### 3. Lógica de Reintento para Errores 422

**Problema**: Los errores 422 por referencias duplicadas no se recuperaban automáticamente.

**Solución**: Se implementó lógica de reintento automático con nueva referencia:

```typescript
// Si es error 422, intentar una vez más con nueva referencia
if (error.response?.status === 422 && !isRetry) {
  const newReference = `TXN-${Date.now()}-${dto.userId}-${Math.random().toString(36).substr(2, 9)}`;
  // ... lógica de reintento
}
```

**Archivos modificados**:
- `wompi.service.ts` (método `createTransaction`)

### 4. Logging Mejorado para Errores 422

**Problema**: Los logs no diferenciaban entre tipos de errores.

**Solución**: Se agregó logging específico para errores 422:

```typescript
if (error.response?.status === 422) {
  logger.warn('Wompi API Validation Error (422)', {
    validationErrors: error.response?.data?.error?.messages,
    errorType: error.response?.data?.error?.type
  });
}
```

**Archivos modificados**:
- `wompi.service.ts` (interceptor de respuestas)

### 5. Respuesta Mejorada del Controlador

**Problema**: El controlador no manejaba específicamente los errores de validación.

**Solución**: Se agregó manejo específico para errores 422:

```typescript
if (error.response?.status === 422 || (error.message && error.message.includes('validación'))) {
  res.status(422).json({
    success: false,
    message: error.message || 'Error de validación en los datos de la transacción',
    validationErrors: error.validationErrors || {},
    error: 'VALIDATION_ERROR'
  });
  return;
}
```

**Archivos modificados**:
- `payment.controller.ts`

## Beneficios de las Mejoras

1. **Reducción de Errores 422**: Las referencias más únicas reducen la probabilidad de duplicados.

2. **Recuperación Automática**: El sistema puede recuperarse automáticamente de errores 422 por referencias duplicadas.

3. **Mejor Debugging**: Los logs específicos facilitan la identificación de problemas.

4. **Información Detallada**: Los errores de validación ahora incluyen detalles específicos sobre qué campos fallaron.

5. **Experiencia de Usuario Mejorada**: Los reintentos automáticos reducen las fallas visibles para el usuario.

## Monitoreo y Métricas

Para monitorear la efectividad de estas mejoras, se recomienda:

1. **Monitorear logs de "Wompi API Validation Error (422)"** para identificar patrones.

2. **Contar reintentos exitosos** con el mensaje "Transacción creada exitosamente (reintento)".

3. **Analizar tipos de errores de validación** más comunes en `validationErrors`.

## Consideraciones Futuras

1. **Límite de Reintentos**: Considerar implementar un límite máximo de reintentos.

2. **Cache de Referencias**: Implementar un cache temporal para evitar referencias duplicadas.

3. **Validación Previa**: Agregar validación del lado del cliente antes de enviar a Wompi.

4. **Métricas de Negocio**: Implementar métricas para medir la tasa de éxito de transacciones.