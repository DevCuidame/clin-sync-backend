export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class BadRequestError extends AppError {
    constructor(message: string = 'Solicitud inválida') {
      super(message, 400);
    }
  }
  
  export class UnauthorizedError extends AppError {
    constructor(message: string = 'No autorizado') {
      super(message, 401);
    }
  }

  export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Datos no procesables') {
    super(message, 422);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación') {
    super(message, 400);
  }
}
  
  export class ForbiddenError extends AppError {
    constructor(message: string = 'Acceso prohibido') {
      super(message, 403);
    }
  }
  
  export class NotFoundError extends AppError {
    constructor(message: string = 'Recurso no encontrado') {
      super(message, 404);
    }
  }
  
  export class ConflictError extends AppError {
    constructor(message: string = 'Conflicto de recursos') {
      super(message, 409);
    }
  }
  
  export class InternalServerError extends AppError {
    constructor(message: string = 'Error interno del servidor') {
      super(message, 500);
    }
  }