# Guía de Implementación de Acceptance Tokens en el Frontend

## Problema Identificado

Según la documentación de Wompi, es **obligatorio** enviar dos tokens de aceptación en todas las transacciones:
- `acceptance_token`: Para la aceptación de la política de privacidad
- `accept_personal_auth`: Para la autorización del tratamiento de datos personales

## Cambios Realizados en el Backend

### 1. DTOs Actualizados
Se agregaron los campos obligatorios a `CreateTransactionDto` y `CreatePaymentLinkDto`:

```typescript
@IsString({ message: 'El token de aceptación debe ser una cadena' })
@IsNotEmpty({ message: 'El token de aceptación es obligatorio' })
acceptanceToken!: string;

@IsString({ message: 'El token de autorización de datos personales debe ser una cadena' })
@IsNotEmpty({ message: 'El token de autorización de datos personales es obligatorio' })
acceptPersonalAuth!: string;
```

### 2. Nuevo Endpoint para Obtener Tokens

**GET** `/api/payments/acceptance-tokens`

Respuesta:
```json
{
  "success": true,
  "message": "Tokens de aceptación obtenidos exitosamente",
  "data": {
    "presigned_acceptance": {
      "acceptance_token": "eyJhbGciOiJIUzI1NiJ9...",
      "permalink": "https://wompi.co/wp-content/uploads/2019/09/TERMINOS-Y-CONDICIONES-DE-USO-USUARIOS-WOMPI.pdf",
      "type": "END_USER_POLICY"
    },
    "presigned_personal_data_auth": {
      "acceptance_token": "eyJhbGciOiJIUzI1NiJ9...",
      "permalink": "https://wompi.com/assets/downloadble/autorizacion-administracion-datos-personales.pdf",
      "type": "PERSONAL_DATA_AUTH"
    }
  }
}
```

## Implementación Requerida en el Frontend

### 1. Servicio para Obtener Tokens

```typescript
// payment.service.ts
export interface AcceptanceTokens {
  presigned_acceptance: {
    acceptance_token: string;
    permalink: string;
    type: string;
  };
  presigned_personal_data_auth: {
    acceptance_token: string;
    permalink: string;
    type: string;
  };
}

async getAcceptanceTokens(): Promise<AcceptanceTokens> {
  const response = await this.http.get<any>(`${this.apiUrl}/acceptance-tokens`).toPromise();
  return response.data;
}
```

### 2. Componente de Aceptación de Términos

Crear un componente que muestre los términos y condiciones:

```typescript
// acceptance-terms.component.ts
export class AcceptanceTermsComponent implements OnInit {
  acceptanceTokens: AcceptanceTokens | null = null;
  termsAccepted = false;
  privacyAccepted = false;

  async ngOnInit() {
    this.acceptanceTokens = await this.paymentService.getAcceptanceTokens();
  }

  get canProceed(): boolean {
    return this.termsAccepted && this.privacyAccepted;
  }

  getTokens() {
    if (!this.acceptanceTokens || !this.canProceed) {
      throw new Error('Debe aceptar todos los términos antes de continuar');
    }

    return {
      acceptanceToken: this.acceptanceTokens.presigned_acceptance.acceptance_token,
      acceptPersonalAuth: this.acceptanceTokens.presigned_personal_data_auth.acceptance_token
    };
  }
}
```

```html
<!-- acceptance-terms.component.html -->
<div class="acceptance-terms" *ngIf="acceptanceTokens">
  <h3>Términos y Condiciones</h3>
  
  <div class="term-item">
    <input 
      type="checkbox" 
      id="terms" 
      [(ngModel)]="termsAccepted"
    >
    <label for="terms">
      He leído y acepto los 
      <a [href]="acceptanceTokens.presigned_acceptance.permalink" target="_blank">
        Términos y Condiciones de Uso
      </a>
    </label>
  </div>

  <div class="term-item">
    <input 
      type="checkbox" 
      id="privacy" 
      [(ngModel)]="privacyAccepted"
    >
    <label for="privacy">
      Autorizo el 
      <a [href]="acceptanceTokens.presigned_personal_data_auth.permalink" target="_blank">
        Tratamiento de Datos Personales
      </a>
    </label>
  </div>
</div>
```

### 3. Actualizar Componente de Compra

```typescript
// package-purchase.component.ts
export class PackagePurchaseComponent {
  @ViewChild(AcceptanceTermsComponent) acceptanceTerms!: AcceptanceTermsComponent;

  async processPurchase() {
    try {
      // Validar que los términos estén aceptados
      if (!this.acceptanceTerms.canProceed) {
        this.showError('Debe aceptar todos los términos y condiciones');
        return;
      }

      // Obtener tokens de aceptación
      const tokens = this.acceptanceTerms.getTokens();

      // Preparar datos de transacción
      const transactionData = {
        purchaseId: this.selectedPackage.id,
        amount: this.selectedPackage.price,
        currency: 'COP',
        paymentMethod: this.selectedPaymentMethod,
        customerInfo: this.customerForm.value,
        description: `Compra de paquete: ${this.selectedPackage.name}`,
        // Agregar tokens obligatorios
        acceptanceToken: tokens.acceptanceToken,
        acceptPersonalAuth: tokens.acceptPersonalAuth
      };

      const result = await this.paymentService.createTransaction(transactionData);
      
      if (result.success) {
        // Redirigir al usuario para completar el pago
        window.location.href = result.redirectUrl;
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPaymentLink() {
    try {
      // Validar términos
      if (!this.acceptanceTerms.canProceed) {
        this.showError('Debe aceptar todos los términos y condiciones');
        return;
      }

      const tokens = this.acceptanceTerms.getTokens();

      const paymentLinkData = {
        purchaseId: this.selectedPackage.id,
        amount: this.selectedPackage.price,
        currency: 'COP',
        customerInfo: this.customerForm.value,
        description: `Pago de paquete: ${this.selectedPackage.name}`,
        // Agregar tokens obligatorios
        acceptanceToken: tokens.acceptanceToken,
        acceptPersonalAuth: tokens.acceptPersonalAuth
      };

      const result = await this.paymentService.createPaymentLink(paymentLinkData);
      
      if (result.success) {
        // Mostrar enlace de pago al usuario
        this.paymentLink = result.permalink;
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}
```

## Flujo de Implementación

1. **Obtener tokens al cargar la página de pago**
2. **Mostrar términos y condiciones con checkboxes**
3. **Validar que ambos términos estén aceptados**
4. **Incluir tokens en todas las peticiones de pago**
5. **Manejar errores de validación del backend**

## Consideraciones Importantes

- Los tokens tienen una **fecha de expiración**, por lo que deben obtenerse cada vez que se carga la página de pago
- Es **obligatorio** mostrar los enlaces a los PDFs de términos y condiciones
- El usuario **debe** hacer clic en ambos checkboxes antes de proceder
- Los tokens deben enviarse en **todas** las transacciones (tanto `createTransaction` como `createPaymentLink`)

## Testing

Para probar la implementación:

1. Verificar que el endpoint `/api/payments/acceptance-tokens` retorna los tokens
2. Confirmar que los enlaces PDF se abren correctamente
3. Validar que las transacciones fallan sin los tokens
4. Confirmar que las transacciones funcionan con los tokens incluidos

Esta implementación cumple con los requisitos de Wompi para el manejo de datos personales según la ley colombiana de Habeas Data.