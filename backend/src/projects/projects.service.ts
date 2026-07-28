import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  // Tüm projeleri getirir
  findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  // ID'ye göre tek bir proje getirir (Null kontrolü eklendi)
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });
    
    if (!project) {
      throw new NotFoundException(`${id} ID'li proje bulunamadı.`);
    }

    return project;
  }
}