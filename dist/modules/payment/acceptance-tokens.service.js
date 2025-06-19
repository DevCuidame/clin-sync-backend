"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcceptanceTokensService = void 0;
const axios_1 = __importDefault(require("axios"));
const wompi_config_1 = require("../../config/wompi.config");
const logger_1 = __importDefault(require("../../utils/logger"));
class AcceptanceTokensService {
    axiosInstance;
    constructor() {
        const config = (0, wompi_config_1.getWompiConfig)();
        this.axiosInstance = axios_1.default.create({
            baseURL: config.baseUrl,
            headers: {
                'Authorization': `Bearer ${config.publicKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }
    /**
     * Obtiene los tokens de aceptación de Wompi
     */
    async getAcceptanceTokens() {
        try {
            const config = (0, wompi_config_1.getWompiConfig)();
            const response = await this.axiosInstance.get(`/merchants/${config.publicKey}`);
            const merchantData = response.data.data;
            if (!merchantData.presigned_acceptance || !merchantData.presigned_personal_data_auth) {
                throw new Error('Tokens de aceptación no encontrados en la respuesta de Wompi');
            }
            return {
                success: true,
                data: {
                    presigned_acceptance: merchantData.presigned_acceptance,
                    presigned_personal_data_auth: merchantData.presigned_personal_data_auth
                }
            };
        }
        catch (error) {
            logger_1.default.error('Error obteniendo tokens de aceptación de Wompi', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            return {
                success: false,
                error: error.message || 'Error desconocido al obtener tokens de aceptación'
            };
        }
    }
    /**
     * Verifica si los tokens de aceptación son válidos
     */
    async validateAcceptanceTokens(acceptanceToken, personalAuthToken) {
        try {
            // Los tokens son JWT, podemos hacer una validación básica
            const isValidFormat = (token) => {
                const parts = token.split('.');
                return parts.length === 3;
            };
            return isValidFormat(acceptanceToken) && isValidFormat(personalAuthToken);
        }
        catch (error) {
            logger_1.default.error('Error validando tokens de aceptación', { error });
            return false;
        }
    }
}
exports.AcceptanceTokensService = AcceptanceTokensService;
