import { Controller, Get, Param, Query, Sse } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { GetProductChangesDto } from './dto/get-product-changes.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * SSE Endpoint: Listen for live product changes.
   */
  @Sse('live-changes')
  liveChanges(): Observable<any> {
    return new Observable((observer) => {
      const sendUpdate = (data: any) => observer.next({ data });

      this.productsService.getLatestChanges().then(sendUpdate);

      return () => {};
    });
  }

  /**
   * Fetch all products with optional filters and pagination.
   */
  @Get()
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'availability', required: false, type: Boolean })
  @ApiQuery({ name: 'provider', required: false, type: String })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products per page (default: 10)',
  })
  async getAllProducts(@Query() filters: GetProductsDto) {
    return this.productsService.getAllProducts(filters);
  }

  /**
   * Fetch product changes within a specified date range with pagination.
   */
  @Get('changes')
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date in YYYY-MM-DD format',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records per page (default: 10)',
  })
  async getProductChanges(@Query() filters: GetProductChangesDto) {
    return this.productsService.getProductChanges(filters);
  }

  /**
   * Fetch a single product by ID, including price history.
   */
  @Get(':id')
  async getProductById(@Param('id') id: number) {
    return this.productsService.getProductById(Number(id));
  }

  /**
   * Simulate a product price change for testing SSE.
   */
  @Get('simulate-change/:id/:price')
  async simulatePriceChange(
    @Param('id') id: number,
    @Param('price') price: number,
  ) {
    return this.productsService.updateProductPrice(Number(id), Number(price));
  }
}
