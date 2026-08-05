import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TemporaryLinkController } from './devs/temporary-link.controller';
import { TemporaryLinkService } from './devs/temporary-link.service';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [ProjectsModule, AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mert',
      database: 'postgres',
      autoLoadEntities: true,
      synchronize: false,
    })
  ],
  controllers: [AppController, TemporaryLinkController],
  providers: [AppService, TemporaryLinkService],
})
export class AppModule {}