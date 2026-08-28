import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('searchField') searchField?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    // URL'den gelen query parametreleri string'tir. Veritabanı için number'a çevirmeliyiz.
    const skipValue = skip ? parseInt(skip, 10) : 0;
    const takeValue = take ? parseInt(take, 10) : 20;

    // Arama terimlerini servise iletiyoruz
    return this.projectsService.findAll(skipValue, takeValue, searchField, searchTerm);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(+id);
  }

  // 1. Giriş yapılmış mı? (JwtAuthGuard)
  // 2. Kullanıcının rolü 'admin' mi? (RolesGuard + @Roles)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createProjectDto: Partial<Project>): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: Partial<Project>,
  ): Promise<Project> {
    return this.projectsService.update(+id, updateProjectDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string): Promise<Project> {
    return this.projectsService.remove(+id);
  }
}
