import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;

  const mockProject: Project = {
    id: 1,
    name: 'Sample Project',
    description: 'Sample Description',
  } as unknown as Project;

  beforeEach(async () => {
    const mockProjectsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of projects and total count', async () => {
      const expectedResult: [Project[], number] = [[mockProject], 1];
      service.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single project by id', async () => {
      service.findOne.mockResolvedValue(mockProject);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });

  describe('create', () => {
    it('should create and return a project', async () => {
      const dto: Partial<Project> = { name: 'Sample Project' };
      service.create.mockResolvedValue(mockProject);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProject);
    });
  });

  describe('update', () => {
    it('should update and return the project', async () => {
      const dto: Partial<Project> = { name: 'Updated Project' };
      const updatedProject = { ...mockProject, ...dto } as Project;
      service.update.mockResolvedValue(updatedProject);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedProject);
    });
  });

  describe('remove', () => {
    it('should delete and return the removed project', async () => {
      service.remove.mockResolvedValue(mockProject);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProject);
    });
  });
});