import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TokenService } from './token.service';

@Module({
  controllers: [],
  providers: [TokenService],
  imports: [HttpModule],
  exports: [TokenService],
})
export class TokenModule {}
