import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';

const PROJECT_ALIASES: Record<string, keyof Project> = {
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

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  // 1. Sayfalama ve toplam kayıt sayısı desteği eklendi
  async findAll(): Promise<[Project[], number]> {
    return this.projectRepository.findAndCount({
    });
  }

  async create(createProjectDto: Partial<Project>): Promise<Project> {
    try {
      const normalized = this.normalizeProjectPayload(createProjectDto);
      const project = this.projectRepository.create(normalized);
      return await this.projectRepository.save(project);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Proje eklenemedi.',
        detail: error instanceof Error ? error.message : String(error),
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

  // 2. Tekrarlanan lookup yerine this.findOne(id) kullanıldı
  async update(
    id: number,
    updateProjectDto: Partial<Project>,
  ): Promise<Project> {
    const project = await this.findOne(id);

    const normalized = this.normalizeProjectPayload(updateProjectDto);
    const updated = this.projectRepository.merge(project, normalized);
    return this.projectRepository.save(updated);
  }

  // 3. Tekrarlanan lookup yerine this.findOne(id) kullanıldı
  async remove(id: number): Promise<Project> {
    const project = await this.findOne(id);

    project.aktifPasif = project.aktifPasif === 'P' ? 'A' : 'P';
    return this.projectRepository.save(project);
  }

  // 4. Mantık sadeleştirildi ve temizlendi
  private normalizeProjectPayload(payload: Partial<Project>): Partial<Project> {
    const normalized: Partial<Project> = { ...payload };

    // customFields kontrolünü tek satırda halledin
    normalized.customFields =
      payload.customFields &&
      typeof payload.customFields === 'object' &&
      !Array.isArray(payload.customFields)
        ? payload.customFields
        : {};

    // Sadece gelen payload'daki key'ler üzerinde dönün (13 alias yerine sadece gelen alanlar kontrol edilir)
    for (const [key, value] of Object.entries(payload)) {
      const targetKey = PROJECT_ALIASES[key];
      if (targetKey && value !== undefined) {
        (normalized as Record<string, unknown>)[targetKey] = value;
      }
    }

    return normalized;
  }
}
