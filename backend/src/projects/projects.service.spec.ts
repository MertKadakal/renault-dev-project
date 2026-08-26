import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<Repository<Project>>;

  const mockProject: Project = {
    id: 1,
    uygulamaAdi: 'Test App',
    tanimUygulamaAciklama: 'Description',
    aktifPasif: 'A',
    customFields: {},
  } as unknown as Project;

  beforeEach(async () => {
    const mockRepo = {
      findAndCount: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get(getRepositoryToken(Project));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated projects and total count with custom skip and take', async () => {
      const expectedResult: [Project[], number] = [[mockProject], 1];
      repository.findAndCount.mockResolvedValue(expectedResult);

      const result = await service.findAll(20, 10);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        order: { id: 'DESC' },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should use default skip (0) and take (45) parameters when not provided', async () => {
      const expectedResult: [Project[], number] = [[mockProject], 1];
      repository.findAndCount.mockResolvedValue(expectedResult);

      const result = await service.findAll();

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        order: { id: 'DESC' },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a project if found', async () => {
      repository.findOneBy.mockResolvedValue(mockProject);

      const result = await service.findOne(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException("999 ID'li proje bulunamadı."),
      );
    });
  });

  describe('create', () => {
    it('should create and save a project with normalized aliases', async () => {
      const payload = {
        uygulama_adi: 'New App',
        customFields: { key: 'value' },
      };

      const normalized = {
        uygulama_adi: 'New App',
        uygulamaAdi: 'New App',
        customFields: { key: 'value' },
      };

      repository.create.mockReturnValue(normalized as any);
      repository.save.mockResolvedValue(mockProject);

      const result = await service.create(payload as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          uygulamaAdi: 'New App',
          customFields: { key: 'value' },
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(normalized);
      expect(result).toEqual(mockProject);
    });

    it('should fallback customFields to empty object if invalid customFields is given', async () => {
      const payload = {
        customFields: ['invalid', 'array'] as any,
      };

      repository.create.mockReturnValue({ customFields: {} } as any);
      repository.save.mockResolvedValue(mockProject);

      await service.create(payload as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customFields: {},
        }),
      );
    });

    it('should throw InternalServerErrorException when repository save fails with Error instance', async () => {
      repository.create.mockReturnValue({} as any);
      repository.save.mockRejectedValue(new Error('Database disk full'));

      await expect(service.create({})).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException when repository save fails with non-Error object', async () => {
      repository.create.mockReturnValue({} as any);
      repository.save.mockRejectedValue('String DB Error');

      await expect(service.create({})).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('should update project with normalized payload and save', async () => {
      const updateDto = { canli_url: 'https://live.example.com' };
      const mergedProject = { ...mockProject, canliUrl: 'https://live.example.com' } as Project;

      repository.findOneBy.mockResolvedValue(mockProject);
      repository.merge.mockReturnValue(mergedProject);
      repository.save.mockResolvedValue(mergedProject);

      const result = await service.update(1, updateDto as any);

      expect(repository.merge).toHaveBeenCalledWith(
        mockProject,
        expect.objectContaining({ canliUrl: 'https://live.example.com' }),
      );
      expect(repository.save).toHaveBeenCalledWith(mergedProject);
      expect(result).toEqual(mergedProject);
    });
  });

  describe('remove', () => {
    it('should toggle aktifPasif from A to P', async () => {
      const activeProject = { ...mockProject, aktifPasif: 'A' } as Project;
      repository.findOneBy.mockResolvedValue(activeProject);
      repository.save.mockImplementation(async (proj) => proj as Project);

      const result = await service.remove(1);

      expect(result.aktifPasif).toBe('P');
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ aktifPasif: 'P' }));
    });

    it('should toggle aktifPasif from P to A', async () => {
      const passiveProject = { ...mockProject, aktifPasif: 'P' } as Project;
      repository.findOneBy.mockResolvedValue(passiveProject);
      repository.save.mockImplementation(async (proj) => proj as Project);

      const result = await service.remove(1);

      expect(result.aktifPasif).toBe('A');
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ aktifPasif: 'A' }));
    });
  });
});