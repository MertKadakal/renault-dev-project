import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { EmployeesService, RawEmployee } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  const mockRawEmployee: RawEmployee = {
    Ipn: '12345',
    Identifier: 'ID01',
    Name: 'John',
    Surname: 'Doe',
    Email: 'john.doe@example.com',
    DirectionCode: 'DIR01',
    DepartmentCode: 'DEP01',
    SuperiorIdentifier: null,
    SuperiorIpn: null,
    SuperiorName: null,
    SuperiorSurname: null,
    PhoneNumber1: null,
    PhoneNumber2: null,
    EmployeeType: 'Full-time',
    Gender: 'M',
    StartDate: '2022-01-01',
    BirthDate: '1990-01-01',
    Quit: false,
    QuitDate: null,
    DepartmentName: 'IT',
    DirectionName: 'Tech',
    PositionCode: 'DEV',
    SuperiorPositionCode: null,
    TitleCode: null,
    SuperiorTitleCode: null,
    Category: null,
    CostCenter: 'CC01',
    Workplace: 'HQ',
    HighSchool: null,
    University: null,
    TfiScore: null,
    ToeicScore: null,
    ShiftCode: null,
    MissionCode: null,
    CitizenshipNumber: '11111111111',
    Level: null,
    Scategory: null,
    CompanyCode: 'COMP01',
    UniqueId: 'UID01',
    Nationality: 'TR',
    HighschoolField: null,
    HighschoolGraduation: null,
    SuperiorDepartmentName: null,
  };

  beforeEach(async () => {
    // Test terminal çıktısındaki Logger hata mesajlarını gizler
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    httpService = {
      get: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('https://api.example.com/employees'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEmployees - Cache & In-Flight Request Handling', () => {
    it('should fetch from API when cache is empty and populate cache', async () => {
      httpService.get.mockReturnValue(of({ data: [mockRawEmployee] } as AxiosResponse));

      const result = await service.getEmployees();

      expect(httpService.get).toHaveBeenCalledWith('https://api.example.com/employees');
      expect(result).toHaveLength(1);
      expect(result[0].Name).toBe('John');
      expect(result[0].Surname).toBe('Doe');
    });

    it('should return cached data on subsequent calls within TTL without re-fetching', async () => {
      httpService.get.mockReturnValue(of({ data: [mockRawEmployee] } as AxiosResponse));

      await service.getEmployees();
      const secondCall = await service.getEmployees();

      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(secondCall).toHaveLength(1);
    });

    it('should reuse existing fetchPromise if concurrent requests arrive', async () => {
      httpService.get.mockReturnValue(of({ data: [mockRawEmployee] } as AxiosResponse));

      // Aynı anda iki paralel çağrı
      const [res1, res2] = await Promise.all([
        service.getEmployees(),
        service.getEmployees(),
      ]);

      expect(httpService.get).toHaveBeenCalledTimes(1);
      expect(res1).toEqual(res2);
    });
  });

  describe('fetchAndProcessEmployees - API URL Config Validation', () => {
    it('should throw error when EMPLOYEES_API_URL is missing in configuration', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(service.getEmployees()).rejects.toThrow(
        'API url for emploeyees is not defined in the environment variables.',
      );
    });
  });

  describe('fetchAndProcessEmployees - Payload Parsing Variations', () => {
    it('should handle response when data is an Array directly', async () => {
      httpService.get.mockReturnValue(of({ data: [mockRawEmployee] } as AxiosResponse));

      const result = await service.getEmployees();
      expect(result).toHaveLength(1);
    });

    it('should handle response when list is in record.employees', async () => {
      httpService.get.mockReturnValue(
        of({ data: { employees: [mockRawEmployee] } } as AxiosResponse),
      );

      const result = await service.getEmployees();
      expect(result).toHaveLength(1);
    });

    it('should handle response when list is in record.data (lines 126)', async () => {
      httpService.get.mockReturnValue(
        of({ data: { data: [mockRawEmployee] } } as AxiosResponse),
      );

      const result = await service.getEmployees();
      expect(result).toHaveLength(1);
    });

    it('should handle response when list is in record.items (lines 127-128)', async () => {
      httpService.get.mockReturnValue(
        of({ data: { items: [mockRawEmployee] } } as AxiosResponse),
      );

      const result = await service.getEmployees();
      expect(result).toHaveLength(1);
    });

    it('should handle response when payload is a key-value dictionary (lines 129-132)', async () => {
      httpService.get.mockReturnValue(
        of({
          data: {
            emp1: mockRawEmployee,
            invalidField: 'not-an-object',
            nullField: null,
          },
        } as AxiosResponse),
      );

      const result = await service.getEmployees();
      expect(result).toHaveLength(1);
    });

    it('should return empty list when data is not an object or array', async () => {
      httpService.get.mockReturnValue(of({ data: 'invalid-string' } as AxiosResponse));

      const result = await service.getEmployees();
      expect(result).toEqual([]);
    });
  });

  describe('fetchAndProcessEmployees - Name & Surname Variations', () => {
    it('should fallback to lowercase name/surname and uppercase FIRST_NAME/LAST_NAME', async () => {
      const variedEmployees = [
        { ...mockRawEmployee, Name: undefined, Surname: undefined, name: 'Ali', surname: 'Veli' },
        { ...mockRawEmployee, Name: undefined, Surname: undefined, FIRST_NAME: 'Ayse', LAST_NAME: 'Fatma' },
        { ...mockRawEmployee, Name: undefined, Surname: undefined },
      ];

      httpService.get.mockReturnValue(of({ data: variedEmployees } as AxiosResponse));

      const result = await service.getEmployees();

      expect(result[0].Name).toBe('Ali');
      expect(result[0].Surname).toBe('Veli');
      expect(result[1].Name).toBe('Ayse');
      expect(result[1].Surname).toBe('Fatma');
      expect(result[2].Name).toBe('');
      expect(result[2].Surname).toBe('');
    });
  });

  describe('fetchAndProcessEmployees - Error Handling', () => {
    it('should catch, log and rethrow Error instances', async () => {
      httpService.get.mockReturnValue(
        throwError(() => new Error('Network timeout')),
      );

      await expect(service.getEmployees()).rejects.toThrow('Network timeout');
    });

    it('should catch, log and rethrow non-Error objects', async () => {
      httpService.get.mockReturnValue(
        throwError(() => 'Plain string error'),
      );

      await expect(service.getEmployees()).rejects.toBe('Plain string error');
    });
  });
});