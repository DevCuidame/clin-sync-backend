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
exports.UpdatePasswordDto = exports.UpdateUserDto = exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
class CreateUserDto {
    first_name;
    last_name;
    identification_type;
    identification_number;
    gender;
    birth_date;
    phone;
    email;
    password;
    address;
    city_id;
    pubname;
    imagebs64;
    verificado;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El apellido es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El apellido debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de identificación es requerido' }),
    (0, class_validator_1.IsString)({
        message: 'El tipo de identificación debe ser una cadena de texto',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "identification_type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El número de identificación es requerido' }),
    (0, class_validator_1.IsString)({
        message: 'El número de identificación debe ser una cadena de texto',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "identification_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El género debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La fecha de nacimiento debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "birth_date", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto' }),
    (0, class_validator_1.Matches)(/^\d{7,15}$/, {
        message: 'El teléfono debe contener entre 7 y 15 dígitos numéricos',
    }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo electrónico es requerido' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Debe proporcionar un correo electrónico válido' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El ID de la ciudad debe ser un número' }),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "city_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El nombre público debe ser una cadena de texto' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "pubname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "imagebs64", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({
        message: 'El estado de verificación debe ser un valor booleano',
    }),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "verificado", void 0);
class UpdateUserDto {
    id;
    first_name;
    last_name;
    identification_type;
    identification_number;
    phone;
    address;
    gender;
    birth_date;
    city_id;
    pubname;
    privname;
    imagebs64;
    path;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El id debe de ser un número' }),
    __metadata("design:type", Number)
], UpdateUserDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "first_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El apellido debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "last_name", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de identificación es requerido' }),
    (0, class_validator_1.IsString)({
        message: 'El tipo de identificación debe ser una cadena de texto',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "identification_type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El número de identificación es requerido' }),
    (0, class_validator_1.IsString)({
        message: 'El número de identificación debe ser una cadena de texto',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "identification_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser una cadena de texto' }),
    (0, class_validator_1.Matches)(/^\d{7,15}$/, {
        message: 'El teléfono debe contener entre 7 y 15 dígitos numéricos',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El género debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La fecha de nacimiento debe ser una cadena de texto' }),
    __metadata("design:type", Date)
], UpdateUserDto.prototype, "birth_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El ID de la ciudad debe ser un número' }),
    __metadata("design:type", Number)
], UpdateUserDto.prototype, "city_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El nombre público debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "pubname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El nombre privado debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "privname", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "imagebs64", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La ruta debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "path", void 0);
class UpdatePasswordDto {
    currentPassword;
    newPassword;
    confirmPassword;
}
exports.UpdatePasswordDto = UpdatePasswordDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña actual es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña actual debe ser una cadena de texto' }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La nueva contraseña es requerida' }),
    (0, class_validator_1.MinLength)(6, {
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
    }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({
        message: 'La confirmación de la nueva contraseña es requerida',
    }),
    (0, class_validator_1.MinLength)(6, {
        message: 'La confirmación de la nueva contraseña debe tener al menos 6 caracteres',
    }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "confirmPassword", void 0);
