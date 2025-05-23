import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

// nestjs实现通过http接口获取token。使用方案3。
// 方案1: 每 30 分钟刷新 token	@nestjs/schedule 定时任务 @Cron
// 方案2: 每次获取 token 后根据token过期时间，设置下一次的定时器
// 方案3: 外部axios拦截器检测到token过期后，触发获取token

// 需求：
// 初始化后，立即尝试获取token
// 避免并发获取token，如果当前正在获取token，等待获取token结果
// 如果获取token成功，返回新的token
// 如果获取token失败，间隔1秒重新获取token，直到成功
// 整个获取token过程（包括重试），对外都表现为获取token中
// 对外提供getToken()，getTokenData()，fetchTokenUntilSuccess()方法
// token请求接口的日志持久化（获取token成功/失败）

@Injectable()
export class TokenService implements OnModuleInit {
  private tokenData = {
    value: '',
    expired: '',
    expiredTime: 0,
  };

  private readonly logger = new Logger(TokenService.name);
  private readonly CLIENT_ID = process.env.CLIENT_ID;
  private readonly CLIENT_SECRET = process.env.CLIENT_SECRET;
  private readonly TOKEN_ENDPOINT =
    'https://gateway.bilinl.com/thirdparty/user/login/client';
  private readonly TOKEN_RETRY_INTERVAL_MS = 1000; // Default 1 second

  private refreshingPromise: Promise<void> | null = null;

  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    if (!this.CLIENT_ID || !this.CLIENT_SECRET) {
      this.logger.error(
        'Missing environment variables CLIENT_ID or CLIENT_SECRET.',
      );
      process.exit(1);
    }

    void this.fetchToken(); // 初始化后立即尝试获取 token
  }

  /**
   * 方案1
   */
  // @Cron('0 */30 * * * *') // 每30分钟触发一次
  private async cronRefresh() {
    this.logger.log('[CRON] Triggered token refresh (every 30 minutes)');
    try {
      await this.fetchToken();
    } catch (err) {
      this.logger.error(`[CRON] Token refresh failed: ${err.message}`);
    }
  }

  /**
   * 方案3
   * 获取有效 token（可用于拦截器）
   * 会自动重试并发控制
   */
  async fetchToken(): Promise<void> {
    if (this.refreshingPromise) {
      return this.refreshingPromise; // 已在刷新，等待
    }

    this.refreshingPromise = new Promise<void>((resolveOuter) => {
      const attemptFetch = async () => {
        try {
          this.logger.log('[TOKEN] Requesting new token...');

          const response = await firstValueFrom(
            this.httpService.post<{
              code: number;
              data: {
                expired: string;
                expiredTime: number;
                value: string;
              };
              message: string;
            }>(this.TOKEN_ENDPOINT, {
              clientId: this.CLIENT_ID,
              clientSecret: this.CLIENT_SECRET,
            }),
          );

          const res = response.data;

          if (res.code !== 0) {
            throw new Error(res.message || 'Token API error');
          }

          this.tokenData = res.data;
          console.log(this.tokenData);
          this.logger.log(
            `[TOKEN] Success. Expires at: ${this.tokenData.expired}`,
          );

          this.refreshingPromise = null;
          resolveOuter(); // 成功，解除外部 await
        } catch (error) {
          this.logger.error(`[TOKEN] Fetch failed: ${error.message}`);
          // 1 秒后继续重试，必须使用 void 消除 eslint 警告
          void setTimeout(
            () => void attemptFetch(),
            this.TOKEN_RETRY_INTERVAL_MS,
          );
        }
      };

      // 初始调用也加上 void 前缀消除 no-misused-promises
      void attemptFetch();
    });

    return this.refreshingPromise;
  }

  getToken(): string {
    return this.tokenData.value;
  }
}
