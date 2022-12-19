import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimiter } from './rateLimiter';
import { ServiceDiscovery } from './serviceDiscovery';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, ServiceDiscovery, RateLimiter],
})
export class AppModule {}