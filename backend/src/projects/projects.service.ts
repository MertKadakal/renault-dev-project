import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
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

  // Sayfalama, arama ve sıralama desteği eklendi
  async findAll(skip = 0, take = 20, searchField?: string, searchTerm?: string): Promise<[Project[], number]> {
    let whereClause: FindOptionsWhere<Project> | FindOptionsWhere<Project>[] = {};

    if (searchTerm && searchTerm.trim() !== '') {
      const term = `%${searchTerm.trim()}%`;

      if (searchField && searchField !== 'all') {
        whereClause = { [searchField]: ILike(term) } as FindOptionsWhere<Project>;
      } else {
        // 'all' seçiliyse tüm metin tabanlı alanlarda (OR mantığı ile) ara
        whereClause = [
          { uygulamaAdi: ILike(term) },
          { sektorluk: ILike(term) } as any,
          { tanimUygulamaAciklama: ILike(term) },
          { frontend: ILike(term) },
          { backend: ILike(term) },
          { databaseType: ILike(term) },
          { platform: ILike(term) },
          { deSorumlu: ILike(term) },
          { sla: ILike(term) },
          { complexity: ILike(term) },
        ];
      }
    }

    return this.projectRepository.findAndCount({
      skip,
      take: take > 0 ? take : undefined, // EĞER take 0 gelirse limitsiz getir!
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      order: { id: 'DESC' },
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

  async update(
    id: number,
    updateProjectDto: Partial<Project>,
  ): Promise<Project> {
    const project = await this.findOne(id);

    const normalized = this.normalizeProjectPayload(updateProjectDto);
    const updated = this.projectRepository.merge(project, normalized);
    return this.projectRepository.save(updated);
  }

  async remove(id: number): Promise<Project> {
    const project = await this.findOne(id);

    project.aktifPasif = project.aktifPasif === 'P' ? 'A' : 'P';
    return this.projectRepository.save(project);
  }

  private normalizeProjectPayload(payload: Partial<Project>): Partial<Project> {
    const normalized: Partial<Project> = { ...payload };

    normalized.customFields =
      payload.customFields &&
      typeof payload.customFields === 'object' &&
      !Array.isArray(payload.customFields)
        ? payload.customFields
        : {};

    for (const [key, value] of Object.entries(payload)) {
      const targetKey = PROJECT_ALIASES[key];
      if (targetKey && value !== undefined) {
        (normalized as Record<string, unknown>)[targetKey] = value;
      }
    }

    return normalized;
  }

  // projects.service.ts içine eklenecek
  async addCustomFieldToAll(key: string, value: string): Promise<void> {
    const projects = await this.projectRepository.find();
    
    // Tüm projeleri dönüp yeni alanı ekliyoruz
    const updatedProjects = projects.map(project => {
      // Eğer customFields yoksa boş obje oluştur, varsa mevcutu al
      const currentFields = project.customFields && typeof project.customFields === 'object' 
        ? project.customFields 
        : {};
        
      return {
        ...project,
        customFields: {
          ...currentFields,
          [key]: value
        }
      };
    });

    // Toplu halde veritabanına kaydet
    await this.projectRepository.save(updatedProjects);
  }

  // Tüm projelerdeki benzersiz custom field anahtarlarını (key) getir
  async getUniqueCustomFieldKeys(): Promise<string[]> {
    // Sadece customFields kolonunu çekerek performansı artırıyoruz
    const projects = await this.projectRepository.find({ select: ['customFields'] });
    const keys = new Set<string>();
    
    projects.forEach(p => {
      if (p.customFields && typeof p.customFields === 'object') {
        Object.keys(p.customFields).forEach(k => keys.add(k));
      }
    });
    
    return Array.from(keys);
  }

  // Özel alanı güncelle (Anahtar adını veya değerini değiştirir)
  async updateCustomFieldInAll(oldKey: string, newKey: string, newValue: string): Promise<void> {
    const projects = await this.projectRepository.find();
    
    const updatedProjects = projects.map(project => {
      if (project.customFields && project.customFields[oldKey] !== undefined) {
        const currentFields = { ...project.customFields };
        
        // Eğer isim değiştiriliyorsa eskisini sil
        if (oldKey !== newKey) {
          delete currentFields[oldKey];
        }
        
        currentFields[newKey] = newValue;
        return { ...project, customFields: currentFields };
      }
      return project; // Bu özel alan bu projede yoksa dokunma
    });

    await this.projectRepository.save(updatedProjects);
  }

  // Özel alanı tamamen sil
  async deleteCustomFieldFromAll(key: string): Promise<void> {
    const projects = await this.projectRepository.find();
    
    const updatedProjects = projects.map(project => {
      if (project.customFields && project.customFields[key] !== undefined) {
        const currentFields = { ...project.customFields };
        delete currentFields[key];
        return { ...project, customFields: currentFields };
      }
      return project;
    });

    await this.projectRepository.save(updatedProjects);
  }
}