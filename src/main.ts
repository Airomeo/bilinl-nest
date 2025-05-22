import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // 依赖 utc 插件

// 扩展 Day.js 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Shanghai'); // "Asia/Shanghai" 是一个 UTC+8 时区

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  await app.listen(process.env.PORT ?? 80);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
