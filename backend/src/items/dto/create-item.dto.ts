import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl
} from 'class-validator';

export class CreateItemDto {
  @IsString({ message: 'Ad alanı metin (string) olmalıdır.' })
  @IsNotEmpty({ message: 'Ad alanı boş bırakılamaz.' })
  ad: string; // Primary Key olarak belirlendi

  @IsString({ message: 'Direktörlük metin olmalıdır.' })
  @IsNotEmpty({ message: 'Direktörlük alanı boş bırakılamaz.' })
  direktörlük: string;

  @IsString({ message: 'Tanım metin olmalıdır.' })
  @IsOptional() // Opsiyonel yapmak istemiyorsan @IsNotEmpty() ile değiştirebilirsin
  tanım?: string;

  @IsUrl({}, { message: 'Geçerli bir URL giriniz.' })
  @IsNotEmpty({ message: 'URL alanı boş bırakılamaz.' })
  url: string;

  @IsUrl({}, { message: 'Geçerli bir test URL\'si giriniz.' })
  @IsOptional()
  test_url?: string;

  @IsBoolean({ message: 'Aktif/Pasif alanı boolean (true/false) olmalıdır.' })
  @IsNotEmpty()
  aktif_pasif: boolean;

  @IsString()
  @IsNotEmpty()
  frontend: string;

  @IsString()
  @IsNotEmpty()
  fe_version: string;

  @IsString()
  @IsNotEmpty()
  backend: string;

  @IsString()
  @IsNotEmpty()
  be_version: string;

  @IsString()
  @IsNotEmpty()
  database: string;

  @IsString()
  @IsNotEmpty()
  platform: string;

  @IsString()
  @IsNotEmpty()
  dev: string;

  @IsString()
  @IsNotEmpty()
  sla: string;
}