/**
 * @file get-products.dto.ts
 * @description Data Transfer Object defining query validation and transform rules for GET /products.
 * Includes pagination support (page, limit) and optional product filters.
 * @module GetProductsDto
 */

import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetProductsDto {
  /** Optional product name filter (case-insensitive substring match) */
  @IsOptional()
  @IsString()
  name?: string;

  /** Optional minimum price constraint */
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  minPrice?: number;

  /** Optional maximum price constraint */
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  maxPrice?: number;

  /** Optional availability status filter */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  availability?: boolean;

  /** Optional provider/source filter (case-insensitive substring match) */
  @IsOptional()
  @IsString()
  provider?: string;

  /** Pagination page number (starts at 1) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Pagination limit (number of products to return per page) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
