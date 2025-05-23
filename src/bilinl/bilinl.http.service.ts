import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class BilinlHttpService implements OnModuleInit {
  private readonly logger = new Logger(BilinlHttpService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly httpService: HttpService, // 这个 HttpService 实例就是被 BilinlHttpConfigService 配置过的那个
  ) {}

  onModuleInit() {
    const TARGET_DOMAIN_PREFIX = 'https://gateway.bilinl.com';

    this.httpService.axiosRef.interceptors.request.use((config) => {
      // Determine the full URL to check against the target domain
      // If baseURL is set on axiosInstance, config.url might be relative.
      const fullUrl = new URL(config.url || '', config.baseURL).toString();

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

      this.logger.log(
        `[${this.onModuleInit.name}] ${JSON.stringify(response.config)} ${JSON.stringify(response.data)}`,
      );

      if (
        fullUrl.startsWith(TARGET_DOMAIN_PREFIX) &&
        (response.data?.code === 2000 || response.data?.code === 2012)
      ) {
        // {"code":2000,"message":"无效的访问令牌","path":"/thirdparty/personal/thirdSetEnterFreTag","extra":{"errorMsg":"invalid_token"},"timestamp":1747202131111}
        // {"code":2012,"extra":{"errorMsg":"Not Authenticated"},"message":"认证失败,请重新登录!","path":"/thirdparty/personal/thirdSetEnterFreTag","timestamp":1747294964636}
        // 重新发起请求（只 retry 一次）
        this.logger.warn('Token expired, attempting to refresh...');
        await this.tokenService.fetchToken(); // Refresh the token
        const token = this.tokenService.getToken();
        response.config.headers['authorization'] = `Bearer ${token}`;

        this.logger.log(`Retrying request with new token...`);
        return this.httpService.axiosRef.request(response.config); // retry
      }
      return response;
    });
  }
}
