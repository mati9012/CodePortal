import { Global, Module } from '@nestjs/common';
import { getDrizzleToken } from '@nestjs/drizzle';
import type { Db } from '../db/index.js';
import { AUTH } from './auth.constants.js';
import { createAuth } from './auth.js';
import { AuthGuard } from './auth.guard.js';
import { MeController } from './me.controller.js';

@Global()
@Module({
  providers: [
    { provide: AUTH, inject: [getDrizzleToken()], useFactory: (db: Db) => createAuth(db) },
    AuthGuard,
  ],
  controllers: [MeController],
  exports: [AUTH, AuthGuard],
})
export class AuthModule {}
