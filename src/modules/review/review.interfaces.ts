import { ReviewStatus } from '../../models/review.model';
import { User } from '../../models/user.model';
import { Professional } from '../../models/professional.model';
import { Appointment } from '../../models/appointment.model';

// Interfaces base para Review
export interface IReview {
  review_id: number;
  appointment_id: number;
  user_id: number;
  professional_id: number;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
}

// Interface para Review con relaciones completas
export interface IReviewWithRelations extends IReview {
  appointment?: Appointment;
  user?: User;
  professional?: Professional;
}

// Interface para crear una nueva review
export interface ICreateReview {
  appointment_id: number;
  rating: number;
  comment?: string;
}

// Interface para actualizar una review
export interface IUpdateReview {
  rating?: number;
  comment?: string;
}

// Interface para actualizar el estado de una review
export interface IUpdateReviewStatus {
  status: ReviewStatus;
  reason?: string;
}

// Interface para filtros de búsqueda
export interface IReviewFilters {
  professional_id?: number;
  user_id?: number;
  status?: ReviewStatus;
  rating?: number;
  page?: number;
  limit?: number;
}

// Interface para respuesta paginada
export interface IReviewPaginatedResponse {
  reviews: IReviewWithRelations[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Interface para estadísticas de reviews
export interface IReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  statusDistribution: {
    pending: number;
    approved: number;
    rejected: number;
    hidden: number;
  };
}

// Interface para review con información del usuario
export interface IReviewWithUserInfo {
  review_id: number;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
  user: {
    user_id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  appointment: {
    appointment_id: number;
    appointment_date: Date;
    status: string;
  };
}

// Interface para review con información del profesional
export interface IReviewWithProfessionalInfo {
  review_id: number;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
  professional: {
    professional_id: number;
    specialization: string;
    user: {
      user_id: number;
      first_name: string;
      last_name: string;
      profile_picture?: string;
    };
  };
  appointment: {
    appointment_id: number;
    appointment_date: Date;
    status: string;
  };
}

// Interface para respuesta de API
export interface IReviewApiResponse {
  success: boolean;
  message: string;
  data?: IReviewWithRelations | IReviewPaginatedResponse | IReviewStats;
  error?: string;
}

// Interface para validación de review
export interface IReviewValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Interface para configuración de review
export interface IReviewConfig {
  maxRating: number;
  minRating: number;
  maxCommentLength: number;
  requireComment: boolean;
  autoApprove: boolean;
  moderationRequired: boolean;
}

// Types auxiliares
export type ReviewSortBy = 'created_at' | 'rating' | 'updated_at';
export type ReviewSortOrder = 'ASC' | 'DESC';

// Interface para ordenamiento
export interface IReviewSort {
  sortBy: ReviewSortBy;
  sortOrder: ReviewSortOrder;
}

// Interface extendida para filtros con ordenamiento
export interface IReviewFiltersExtended extends IReviewFilters, IReviewSort {
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}