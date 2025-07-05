import { IsInt, IsString, IsOptional, IsEnum, Min, Max, IsNotEmpty, IsDateString, Length, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ReviewStatus } from '../../models/review.model';
import { 
  ICreateReview, 
  IUpdateReview, 
  IUpdateReviewStatus, 
  IReviewFilters,
  IReviewFiltersExtended,
  ReviewSortBy,
  ReviewSortOrder
} from './review.interfaces';

export class CreateReviewDto implements ICreateReview {
  @IsInt({ message: 'El ID de la cita debe ser un número entero' })
  @IsNotEmpty({ message: 'El ID de la cita es requerido' })
  @Type(() => Number)
  appointment_id!: number;

  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @Type(() => Number)
  rating!: number;

  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  @IsOptional()
  @Length(0, 1000, { message: 'El comentario no puede exceder 1000 caracteres' })
  comment?: string;
}

export class UpdateReviewDto implements IUpdateReview {
  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  @IsOptional()
  @Length(0, 1000, { message: 'El comentario no puede exceder 1000 caracteres' })
  comment?: string;
}

export class UpdateReviewStatusDto implements IUpdateReviewStatus {
  @IsEnum(ReviewStatus, { message: 'Estado de review inválido' })
  @IsNotEmpty({ message: 'El estado es requerido' })
  status!: ReviewStatus;

  @IsString({ message: 'La razón debe ser una cadena de texto' })
  @IsOptional()
  @Length(0, 500, { message: 'La razón no puede exceder 500 caracteres' })
  reason?: string;
}

export class ReviewFilterDto implements IReviewFilters {
  @IsInt({ message: 'El ID del profesional debe ser un número entero' })
  @IsOptional()
  @Type(() => Number)
  professional_id?: number;

  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @IsOptional()
  @Type(() => Number)
  user_id?: number;

  @IsEnum(ReviewStatus, { message: 'Estado de review inválido' })
  @IsOptional()
  status?: ReviewStatus;

  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1' })
  @Max(5, { message: 'La calificación máxima es 5' })
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class ReviewFilterExtendedDto extends ReviewFilterDto implements IReviewFiltersExtended {
  @IsEnum(['created_at', 'rating', 'updated_at'], { message: 'Campo de ordenamiento inválido' })
  @IsOptional()
  sortBy: ReviewSortBy = 'created_at';

  @IsEnum(['ASC', 'DESC'], { message: 'Orden de clasificación inválido' })
  @IsOptional()
  sortOrder: ReviewSortOrder = 'DESC';

  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  @IsOptional()
  @Length(0, 100, { message: 'El término de búsqueda no puede exceder 100 caracteres' })
  search?: string;

  @IsDateString({}, { message: 'Fecha desde inválida' })
  @IsOptional()
  dateFrom?: Date;

  @IsDateString({}, { message: 'Fecha hasta inválida' })
  @IsOptional()
  dateTo?: Date;
}

export class ReviewStatsDto {
  @IsInt({ message: 'El ID del profesional debe ser un número entero' })
  @IsOptional()
  @Type(() => Number)
  professional_id?: number;

  @IsDateString({}, { message: 'Fecha desde inválida' })
  @IsOptional()
  dateFrom?: Date;

  @IsDateString({}, { message: 'Fecha hasta inválida' })
  @IsOptional()
  dateTo?: Date;

  @IsBoolean({ message: 'includeHidden debe ser un valor booleano' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeHidden?: boolean = false;
}