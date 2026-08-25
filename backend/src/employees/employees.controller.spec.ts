import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService, NormalizedEmployee } from './employees.service';

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: jest.Mocked<EmployeesService>;

  beforeEach(async () => {
    const mockEmployeesService = {
      getEmployees: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get(EmployeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getEmployees', () => {
    it('should return an array of normalized employees', async () => {
      const mockEmployees: NormalizedEmployee[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        } as unknown as NormalizedEmployee,
      ];

      service.getEmployees.mockResolvedValue(mockEmployees);

      const result = await controller.getEmployees();

      expect(service.getEmployees).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEmployees);
    });
  });
});