import { IsString, IsNotEmpty, IsNumber, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WhatsAppTemplateParamsDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @IsString()
  @IsNotEmpty()
  time!: string;

  @IsString()
  @IsNotEmpty()
  latitude!: string;

  @IsString()
  @IsNotEmpty()
  longitude!: string;
}

export class SendQRScanNotificationDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsString()
  @IsNotEmpty()
  patientName!: string;

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;
}

export class SendTemplateMessageDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString()
  @IsNotEmpty()
  templateName!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => WhatsAppTemplateParamsDto)
  templateParams!: WhatsAppTemplateParamsDto;
}

export class WhatsAppWebhookDto {
  @IsString()
  @IsNotEmpty()
  object!: string;

  @IsObject()
  entry!: any[];
}