/**
 * Interfaz estándar para las respuestas de la API
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: any;
    timestamp?: string;
    metadata?: {
      count?: number;
      totalItems?: number;
      totalPages?: number;
      currentPage?: number;
      [key: string]: any;
    };
  }
  
  /**
   * Interfaz para parámetros de paginación
   */
  export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }
  
  /**
   * Interfaz para resultados paginados
   */
  export interface PaginatedResult<T> {
    items: T[];
    metadata: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }
  
  /**
   * Opciones de filtro genéricas
   */
  export interface FilterOptions {
    [key: string]: any;
  }