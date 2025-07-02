import { IsInt, IsString, IsOptional, IsEnum, Min, Max, IsNotEmpty } from 'class-validator';
import { ReviewStatus } from '../../models/review.model';

export class CreateReviewDto {
  @IsInt()
  @IsNotEmpty()
  appointment_id!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class UpdateReviewStatusDto {
  @IsEnum(ReviewStatus)
  @IsNotEmpty()
  status!: ReviewStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ReviewFilterDto {
  @IsInt()
  @IsOptional()
  professional_id?: number;

  @IsInt()
  @IsOptional()
  user_id?: number;

  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;
}