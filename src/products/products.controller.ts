import {
  Controller,
  Get,
  MessageEvent,
  Param,
  ParseIntPipe,
  Query,
  Sse,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Observable, map, merge, from } from 'rxjs';

@ApiTags('Products')
@ApiSecurity('api-key')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * SSE: streams live price-change events to connected clients.
   * On connect, immediately sends the latest 10 changes as a snapshot,
   * then continues pushing new events as they occur.
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

    // Ongoing live events pushed via Subject
    const live$ = this.productsService.productChanges$.pipe(
      map((event) => ({ data: JSON.stringify(event) }) as MessageEvent),
    );

    return merge(snapshot$, live$);
  }

  /**
   * GET /products — filterable, paginated product list.
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
   * GET /products/changes — price and availability changes within a timeframe.
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
   * GET /products/:id — single product with full price history.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID including its price history' })
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductById(id);
  }

  /**
   * GET /products/simulate-change/:id/:price — trigger a manual price update for testing SSE.
   */
  @Get('simulate-change/:id/:price')
  @ApiOperation({ summary: 'Simulate a price change to test the SSE stream' })
  simulatePriceChange(
    @Param('id', ParseIntPipe) id: number,
    @Param('price', ParseIntPipe) price: number,
  ) {
    return this.productsService.updateProductPrice(id, price);
  }
}
