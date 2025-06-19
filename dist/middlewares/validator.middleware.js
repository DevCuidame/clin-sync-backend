"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const error_handler_1 = require("../utils/error-handler");
/**
 * Middleware para validar los datos de petición según el DTO especificado
 * @param dto - La clase DTO a usar para validación
 * @param source - Fuente de datos a validar (body, query, params)
 */
const validateDto = (dto, source = 'body') => {
    return async (req, res, next) => {
        const dtoObj = (0, class_transformer_1.plainToInstance)(dto, req[source]);
        // Validar
        const errors = await (0, class_validator_1.validate)(dtoObj, {
            whitelist: true,
            forbidNonWhitelisted: true
        });
        if (errors.length > 0) {
            // Formatear errores para una mejor experiencia de usuario
            const formattedErrors = errors.map(error => {
                const constraints = error.constraints || {};
                return {
                    property: error.property,
                    messages: Object.values(constraints)
                };
            });
            return next(new error_handler_1.BadRequestError(`Validación fallida: ${JSON.stringify(formattedErrors)}`));
        }
        // Si no hay errores, continuar
        req[source] = dtoObj;
        next();
    };
};
exports.validateDto = validateDto;
