import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { EmployeesModule } from './employees/employees.module';

@Module({
  imports: [ProjectsModule, AuthModule, EmployeesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '10.237.139.133',
      port: 5432,
      username: 'mert',
      password: 'renault_mert',
      database: 'dev_team_apps',
      autoLoadEntities: true,
      synchronize: false,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}