/**
 * @file products.controller.ts
 * @description Exposes HTTP endpoints for querying aggregated product data,
 * historical price and availability changes, streaming live updates via Server-Sent Events (SSE),
 * and manual price simulations for testing purposes.
 * @module ProductsController
 */

import {
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import {
  ApiOperation,
  ApiQuery,
  ApiSecurity,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { Observable, map, merge, from } from 'rxjs';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { Role } from '../modules/auth/enums/role.enum';

@ApiTags('Products')
@ApiSecurity('api-key')
@Controller('products')
export class ProductsController {
  /**
   * Creates an instance of ProductsController.
   * @param {ProductsService} productsService - Injected products service managing data catalog
   */
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Server-Sent Events (SSE) route streaming live price changes.
   * On connection, instantly pushes the latest 10 changes as an array snapshot,
   * then merges and streams new changes in real-time as they are broadcast by the service.
   * Exempt from API key and JWT authentication requirements to permit frontend SSE streams.
   *
   * @returns {Observable<MessageEvent>} Continuous stream of MessageEvents carrying JSON stringified objects
   */
  @Sse('live-changes')
  @ApiOperation({
    summary: 'SSE stream of live price changes (no API key required)',
  })
  liveChanges(): Observable<MessageEvent> {
    // Snapshot of recent changes sent immediately on connect
    const snapshot$ = from(this.productsService.getLatestChanges()).pipe(
      map((changes) => ({ data: JSON.stringify(changes) }) as MessageEvent),
    );

    // Ongoing live events pushed via RxJS Subject
    const live$ = this.productsService.productChanges$.pipe(
      map((event) => ({ data: JSON.stringify(event) }) as MessageEvent),
    );

    // Merge snapshot and live streams together into a single continuous stream
    return merge(snapshot$, live$);
  }

  /**
   * Queries and filters the aggregated product catalog.
   * Leverages caching inside the service layer.
   *
   * @param {GetProductsDto} filters - Querystring filters (name, minPrice, maxPrice, availability, provider, page, limit)
   * @returns {Promise<{ page: number, limit: number, total: number, totalPages: number, data: any[] }>} Paginated list of products matching criteria
   */
  @Get()
  @ApiOperation({
    summary: 'List all products with optional filters and pagination',
  })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'availability', required: false, type: Boolean })
  @ApiQuery({ name: 'provider', required: false, type: String })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Default: 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Default: 10',
  })
  getAllProducts(@Query() filters: GetProductsDto) {
    return this.productsService.getAllProducts(filters);
  }

  /**
   * Retrieves paginated historic pricing or availability changes within a specific date range.
   *
   * @param {GetProductChangesDto} filters - Timeframe boundaries and pagination page/limit
   * @returns {Promise<{ page: number, limit: number, total: number, totalPages: number, data: any[] }>} Paginated historic changes
   */
  @Get('changes')
  @ApiOperation({
    summary: 'Get products with price or availability changes in a timeframe',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'ISO date string',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Default: 1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Default: 10',
  })
  getProductChanges(@Query() filters: GetProductChangesDto) {
    return this.productsService.getProductChanges(filters);
  }

  /**
   * Retrieves a single product card by its unique ID, including its complete historical changes log.
   *
   * @param {number} id - The ID of the target product
   * @returns {Promise<any>} Product details with full nested priceHistory relation array
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID including its price history' })
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  /**
   * Simulates a manual price update for testing real-time client alerts.
   * Restricted to users authenticated via JWT holding the ADMIN security role.
   *
   * @param {number} id - Target product ID
   * @param {number} price - Simulated new price
   * @returns {Promise<any>} The updated product record
   */
  @Get('simulate-change/:id/:price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate a price change (ADMIN only)' })
  simulatePriceChange(
    @Param('id', ParseIntPipe) id: number,
    @Param('price', ParseIntPipe) price: number,
  ) {
    return this.productsService.updateProductPrice(id, price);
  }
}
