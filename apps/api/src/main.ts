import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module.js';
import { AUTH } from './auth/auth.constants.js';
import type { Auth } from './auth/auth.js';

const JSON_BODY_LIMIT = '2mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.set('trust proxy', true);
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app
    .getHttpAdapter()
    .getInstance()
    .all('/api/auth/{*path}', toNodeHandler(app.get<Auth>(AUTH)));
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { extended: true });
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
