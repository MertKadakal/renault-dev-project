import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.projectRepository.find();
  }

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    try {
      const normalized = this.normalizeProjectPayload(createProjectDto);
      const project = this.projectRepository.create(normalized);
      return await this.projectRepository.save(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Proje eklenemedi.',
        detail: error instanceof Error ? error.message : error,
      });
    }
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });

    if (!project) {
      throw new NotFoundException(`${id} ID'li proje bulunamadı.`);
    }

    return project;
  }

  async update(id: number, updateProjectDto: Partial<Project>): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });

    if (!project) {
      throw new NotFoundException(`${id} ID'li proje bulunamadı.`);
    }

    const normalized = this.normalizeProjectPayload(updateProjectDto);
    const updated = this.projectRepository.merge(project, normalized);
    return this.projectRepository.save(updated);
  }

  async remove(id: number): Promise<Project> {
    const project = await this.projectRepository.findOneBy({ id });

    if (!project) {
      throw new NotFoundException(`${id} ID'li proje bulunamadı.`);
    }

    project.aktifPasif = project.aktifPasif === 'P' ? 'A' : 'P';
    return this.projectRepository.save(project);
  }

  private normalizeProjectPayload(payload: Partial<Project>): Partial<Project> {
    const normalized: Partial<Project> = { ...payload };

    if (payload.customFields === undefined || payload.customFields === null) {
      normalized.customFields = {};
    } else if (Array.isArray(payload.customFields)) {
      normalized.customFields = {};
    } else {
      normalized.customFields = payload.customFields;
    }

    if (payload.uygulamaAdi) {
      normalized.uygulamaAdi = payload.uygulamaAdi;
    }

    if ((payload as any).uygulama_adi) {
      normalized.uygulamaAdi = (payload as any).uygulama_adi;
    }

    const aliases: Record<string, keyof Project> = {
      uygulama_adi: 'uygulamaAdi',
      tanim_uygulama_aciklama: 'tanimUygulamaAciklama',
      canli_url: 'canliUrl',
      test_url: 'testUrl',
      aktif_pasif: 'aktifPasif',
      fe_version: 'feVersion',
      be_version: 'beVersion',
      database_type: 'databaseType',
      de_sorumlu: 'deSorumlu',
      sla: 'sla',
    };

    Object.entries(aliases).forEach(([source, target]) => {
      const value = (payload as any)[source];
      if (value !== undefined) {
        (normalized as any)[target] = value;
      }
    });

    return normalized;
  }
}