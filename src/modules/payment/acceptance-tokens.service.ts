import axios, { AxiosInstance } from 'axios';
import { getWompiConfig } from '../../config/wompi.config';
import logger  from '../../utils/logger';

export interface WompiAcceptanceTokens {
  presigned_acceptance: {
    acceptance_token: string;
    permalink: string;
    type: string;
  };
  presigned_personal_data_auth: {
    acceptance_token: string;
    permalink: string;
    type: string;
  };
}

export interface AcceptanceTokensResponse {
  success: boolean;
  data?: WompiAcceptanceTokens;
  error?: string;
}

export class AcceptanceTokensService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const config = getWompiConfig();
    
    this.axiosInstance = axios.create({
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
  async getAcceptanceTokens(): Promise<AcceptanceTokensResponse> {
    try {
      const config = getWompiConfig();
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
    } catch (error: any) {
      logger.error('Error obteniendo tokens de aceptación de Wompi', {
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
  async validateAcceptanceTokens(acceptanceToken: string, personalAuthToken: string): Promise<boolean> {
    try {
      // Los tokens son JWT, podemos hacer una validación básica
      const isValidFormat = (token: string) => {
        const parts = token.split('.');
        return parts.length === 3;
      };

      return isValidFormat(acceptanceToken) && isValidFormat(personalAuthToken);
    } catch (error) {
      logger.error('Error validando tokens de aceptación', { error });
      return false;
    }
  }
}