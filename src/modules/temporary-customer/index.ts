// Exportaciones principales del módulo temporary-customer
export { TemporaryCustomer, IdentificationType } from '../../models/temporary-customer.model';
export { TemporaryCustomerService } from './temporary-customer.service';
export { TemporaryCustomerController } from './temporary-customer.controller';
export { default as temporaryCustomerRoutes } from './temporary-customer.routes';

// Exportar interfaces y DTOs
export {
  SessionStats,
  SessionManagementState,
  CustomerSearchParams,
  CustomerSearchResponse,
  CustomerSessionsResponse,
  SearchFormData,
  SessionDisplayInfo,
  SessionAction,
  SessionStatusConfig
} from './temporary-customer.interface';

export {
  SearchByIdentificationDto,
  SearchMultipleCustomersDto,
  SessionStatsDto,
  SessionWithServiceDto,
  CustomerSessionsResponseDto,
  CustomerSearchResponseDto,
  PaginationDto,
  AdvancedSearchDto
} from './temporary-customer.dto';