/**
 * @file get-product-changes.dto.ts
 * @description Data Transfer Object defining queries for GET /products/changes.
 * Parses validation constraints for startDate, endDate range boundaries, and pagination details.
 * @module GetProductChangesDto
 */

import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductChangesDto {
  /** Optional start date for change history query window (ISO Date String) */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** Optional end date for change history query window (ISO Date String) */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /** Pagination page number (starts at 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Pagination limit (number of changes to return per page) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
