import { HttpModule, HttpService } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenModule } from 'src/token/token.module';
import { TokenService } from 'src/token/token.service';
import { BilinlController } from './bilinl.controller';
import { BilinlProcessor } from './bilinl.processor';
import { BilinlService } from './bilinl.service';

@Module({
  providers: [BilinlService, BilinlProcessor, PrismaService],
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
export class BilinlModule implements OnModuleInit {
  private readonly logger = new Logger(BilinlModule.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    const TARGET_DOMAIN_PREFIX = 'https://gateway.bilinl.com';

    this.httpService.axiosRef.interceptors.request.use(async (config) => {
      // Determine the full URL to check against the target domain
      // If baseURL is set on axiosInstance, config.url might be relative.
      const fullUrl = new URL(config.url || '', config.baseURL).toString();
      console.log(fullUrl);

      if (fullUrl.startsWith(TARGET_DOMAIN_PREFIX)) {
        const token = this.tokenService.getToken();
        config.headers['authorization'] = `Bearer ${token}`;
      }
      return config;
    });

    this.httpService.axiosRef.interceptors.response.use(async (response) => {
      // Determine the full URL to check against the target domain
      // If baseURL is set on axiosInstance, config.url might be relative.
      const fullUrl = new URL(
        response.config.url || '',
        response.config.baseURL,
      ).toString();
      console.log(response.data);

      if (
        fullUrl.startsWith(TARGET_DOMAIN_PREFIX) &&
        response.data?.code === 2000 &&
        response.data?.code === 2012
      ) {
        // {"code":2000,"message":"无效的访问令牌","path":"/thirdparty/personal/thirdSetEnterFreTag","extra":{"errorMsg":"invalid_token"},"timestamp":1747202131111}
        // {"code":2012,"extra":{"errorMsg":"Not Authenticated"},"message":"认证失败,请重新登录!","path":"/thirdparty/personal/thirdSetEnterFreTag","timestamp":1747294964636}
        // 重新发起请求（只 retry 一次）
        this.logger.warn('Token expired, attempting to refresh...');

        await this.tokenService.fetchToken(); // Refresh the token
        const token = this.tokenService.getToken();
        response.config.headers['authorization'] = `Bearer ${token}`;

        return this.httpService.axiosRef.request(response.config); // retry
      }
      return response;
    });
  }
}
