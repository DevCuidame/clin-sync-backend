"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordDto = exports.DeleteAccountDto = exports.VerifyPasswordDto = exports.RefreshTokenDto = exports.ResetPasswordDto = exports.ForgotPasswordDto = exports.RegisterDto = exports.LoginDto = void 0;
const class_validator_1 = require("class-validator");
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Debe proporcionar un correo electrónico válido' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RegisterDto {
    first_name;
    last_name;
    identification_type;
    identification_number;
    phone;
    email;
    gender;
    birth_date;
    password;
    city_id;
    address;
    pubname;
    imagebs64;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El apellido es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El apellido debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de identificación es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El tipo de identificación debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "identification_type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El número de identificación es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El número de identificación debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "identification_number", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto' }),
    (0, class_validator_1.Matches)(/^\d{7,15}$/, { message: 'El teléfono debe contener entre 7 y 15 dígitos numéricos' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Debe proporcionar un correo electrónico válido' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El género debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La fecha de nacimiento debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "birth_date", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La ciudad es requerida' }),
    __metadata("design:type", Number)
], RegisterDto.prototype, "city_id", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La dirección es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El nombre público debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "pubname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "imagebs64", void 0);
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Debe proporcionar un correo electrónico válido' }),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
    token;
    password;
    confirmPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El token es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El token debe ser una cadena de texto' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La confirmación de contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "confirmPassword", void 0);
class RefreshTokenDto {
    refresh_token;
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El refresh token es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El refresh token debe ser una cadena de texto' }),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refresh_token", void 0);
class VerifyPasswordDto {
    password;
}
exports.VerifyPasswordDto = VerifyPasswordDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña debe ser una cadena de texto' }),
    __metadata("design:type", String)
], VerifyPasswordDto.prototype, "password", void 0);
class DeleteAccountDto {
    password;
    reason;
    otherReason;
    confirmation;
}
exports.DeleteAccountDto = DeleteAccountDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña debe ser una cadena de texto' }),
    __metadata("design:type", String)
], DeleteAccountDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La razón debe ser una cadena de texto' }),
    __metadata("design:type", String)
], DeleteAccountDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La razón personalizada debe ser una cadena de texto' }),
    __metadata("design:type", String)
], DeleteAccountDto.prototype, "otherReason", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La confirmación es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La confirmación debe ser una cadena de texto' }),
    __metadata("design:type", String)
], DeleteAccountDto.prototype, "confirmation", void 0);
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña actual es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña actual debe ser una cadena de texto' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La nueva contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' }),
    (0, class_validator_1.IsString)({ message: 'La nueva contraseña debe ser una cadena de texto' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
