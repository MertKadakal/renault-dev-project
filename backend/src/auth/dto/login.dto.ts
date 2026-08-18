import { IsNotEmpty, isString, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: ' Kullanıcı adı metin tipinde olmalıdır' })
  @IsNotEmpty({ message: ' Kullanıcı adı boş bırakılamaz' })
  @Matches(/^([a-zA-Z]{2}\d{5}|admin|user)$/, {
    message: ' Kullanıcı adı at00000 formatında olmalıdır',
  })  username: string;

  @IsString({ message: ' Şifre metin tipinde olmalıdır' })
  @IsNotEmpty({ message: ' Şifre boş bırakılamaz' })
  pass: string;
}