import { Body, Controller, Get, Post } from '@nestjs/common';
import { BilinlService } from './bilinl.service';

@Controller('callback')
export class BilinlController {
  constructor(private readonly bilinlService: BilinlService) {}

  @Get()
  getHello(): string {
    return 'hello';
  }

  @Post()
  handleCallback(@Body() body: any) {
    if (!body?.type) {
      return 'Missing callback type';
    }

    return this.bilinlService.enqueueCallback(body);
  }
}
