import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  first_name!: string;

  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  last_name!: string;

  @IsNotEmpty({ message: 'El tipo de identificación es requerido' })
  @IsString({
    message: 'El tipo de identificación debe ser una cadena de texto',
  })
  identification_type!: string;

  @IsNotEmpty({ message: 'El número de identificación es requerido' })
  @IsString({
    message: 'El número de identificación debe ser una cadena de texto',
  })
  identification_number!: string;

  @IsOptional()
  @IsString({ message: 'El género debe ser una cadena de texto' })
  gender?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de nacimiento debe ser una cadena de texto' })
  birth_date?: string;

  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\d{7,15}$/, {
    message: 'El teléfono debe contener entre 7 y 15 dígitos numéricos',
  })
  phone!: string;

  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la ciudad debe ser un número' })
  city_id?: number;

  @IsOptional()
  @IsString({ message: 'El nombre público debe ser una cadena de texto' })
  pubname?: string;

  @IsOptional()
  imagebs64?: string;

  @IsOptional()
  @IsBoolean({
    message: 'El estado de verificación debe ser un valor booleano',
  })
  verificado?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsNumber({},{ message: 'El id debe de ser un número' })
  id?: number;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  first_name?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  last_name?: string;

  @IsNotEmpty({ message: 'El tipo de identificación es requerido' })
  @IsString({
    message: 'El tipo de identificación debe ser una cadena de texto',
  })
  identification_type!: string;

  @IsNotEmpty({ message: 'El número de identificación es requerido' })
  @IsString({
    message: 'El número de identificación debe ser una cadena de texto',
  })
  identification_number!: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^\d{7,15}$/, {
    message: 'El teléfono debe contener entre 7 y 15 dígitos numéricos',
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'El género debe ser una cadena de texto' })
  gender!: string;

  @IsOptional()
  @IsString({ message: 'La fecha de nacimiento debe ser una cadena de texto' })
  birth_date!: Date;

  @IsOptional()
  @IsNumber({}, { message: 'El ID de la ciudad debe ser un número' })
  city_id?: number;

  @IsOptional()
  @IsString({ message: 'El nombre público debe ser una cadena de texto' })
  pubname?: string;

  @IsOptional()
  @IsString({ message: 'El nombre privado debe ser una cadena de texto' })
  privname?: string;

  @IsOptional()
  imagebs64?: string;

  @IsOptional()
  @IsString({ message: 'La ruta debe ser una cadena de texto' })
  path?: string;
}

export class UpdatePasswordDto {
  @IsNotEmpty({ message: 'La contraseña actual es requerida' })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  currentPassword!: string;

  @IsNotEmpty({ message: 'La nueva contraseña es requerida' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword!: string;

  @IsNotEmpty({
    message: 'La confirmación de la nueva contraseña es requerida',
  })
  @MinLength(6, {
    message:
      'La confirmación de la nueva contraseña debe tener al menos 6 caracteres',
  })
  confirmPassword!: string;
}
