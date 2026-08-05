import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TemporaryLinkService } from './temporary-link.service';

@Controller('temp-link')
export class TemporaryLinkController {
  constructor(private readonly tempLinkService: TemporaryLinkService) {}

  // 1. Geçici link/token üretme endpoint'i
  @Post('generate')
  generateLink(@Body() body: { payload: any; ttlSeconds?: number }) {
    const { token, expiresAt } = this.tempLinkService.createTemporaryLink(
      body.payload,
      body.ttlSeconds || 300, // Varsayılan 5 dakika
    );

    return {
      token,
      expiresAt,
      shareableUrl: `http://localhost:4200/view-temp-data/${token}`,
    };
  }

  // 2. Geçici link üzerinden JSON çekme endpoint'i
  @Get(':token')
  getData(@Param('token') token: string) {
    return this.tempLinkService.getDataByToken(token);
  }
}