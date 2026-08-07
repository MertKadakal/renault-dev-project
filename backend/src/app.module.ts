import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [ProjectsModule, AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
<<<<<<< HEAD
      host: '10.237.139.133',
      port: 5432,
      username: 'mert',
      password: 'renault_mert',
      database: 'dev_team_apps',
=======
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mert',
      database: 'postgres',
>>>>>>> 6959602e84eb35b5a37ee2f6890111f62c22482e
      autoLoadEntities: true,
      synchronize: false,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}