import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GoneException, NotFoundException } from '@nestjs/common';
import { TemporaryLinkService } from './temporary-link.service';

describe('TemporaryLinkService', () => {
  let service: TemporaryLinkService;

  beforeEach(() => {
    service = new TemporaryLinkService();
  });

  it('geçerli bir token ve son kullanma tarihi üretmeli', () => {
    const result = service.createTemporaryLink({ user: 'test' }, 60);
    expect(result.token).toBeDefined();
    expect(result.expiresAt).toBeInstanceOf(Date);
  });

  it('süresi dolmamış veri başarıyla çekilmeli', () => {
    const { token } = service.createTemporaryLink({ name: 'NestJS' }, 60);
    const data = service.getDataByToken(token);
    expect(data).toEqual({ name: 'NestJS' });
  });

  it('olmayan token için NotFoundException fırlatmalı', () => {
    expect(() => service.getDataByToken('gecersiz-token')).toThrow(NotFoundException);
  });

  it('süresi dolmuş token için GoneException fırlatmalı', () => {
    jest.useFakeTimers();
    const { token } = service.createTemporaryLink({ data: 'test' }, 5); // 5 saniyelik TTL

    // Zamanı 6 saniye ileri alalım
    jest.advanceTimersByTime(6000);

    expect(() => service.getDataByToken(token)).toThrow(GoneException);
    jest.useRealTimers();
  });
});