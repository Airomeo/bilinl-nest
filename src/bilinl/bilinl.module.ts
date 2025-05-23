import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenModule } from 'src/token/token.module';
import { BilinlController } from './bilinl.controller';
import { BilinlHttpService } from './bilinl.http.service';
import { BilinlProcessor } from './bilinl.processor';
import { BilinlService } from './bilinl.service';

@Module({
  providers: [BilinlService, BilinlProcessor, BilinlHttpService, PrismaService],
  imports: [
    TokenModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'bilinl',
    }),
  ],
  exports: [BilinlService],
  controllers: [BilinlController],
})
export class BilinlModule {}
