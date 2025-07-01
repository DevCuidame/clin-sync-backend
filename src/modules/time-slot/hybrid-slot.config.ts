export interface HybridSlotConfig {
  // Default slot duration in minutes
  defaultDuration: number;
  
  // Auto-generation settings
  autoGenerate: {
    enabled: boolean;
    maxSlotsPerDay: number;
    minSlotDuration: number;
    maxSlotDuration: number;
  };
  
  // Persistence settings
  persistence: {
    enabled: boolean;
    popularityThreshold: number; // Number of requests before persisting
    autoCleanup: boolean;
    cleanupAfterDays: number;
  };
  
  // Performance settings
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number; // Cache time-to-live in seconds
    maxConcurrentGenerations: number;
  };
  
  // Business rules
  businessRules: {
    allowOverlapping: boolean;
    respectBreaks: boolean;
    respectVacations: boolean;
    bufferBetweenSlots: number; // Minutes between slots
  };
}

export const DEFAULT_HYBRID_CONFIG: HybridSlotConfig = {
  defaultDuration: 30,
  
  autoGenerate: {
    enabled: true,
    maxSlotsPerDay: 50,
    minSlotDuration: 15,
    maxSlotDuration: 120
  },
  
  persistence: {
    enabled: false,
    popularityThreshold: 5,
    autoCleanup: true,
    cleanupAfterDays: 30
  },
  
  performance: {
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
    maxConcurrentGenerations: 10
  },
  
  businessRules: {
    allowOverlapping: false,
    respectBreaks: true,
    respectVacations: true,
    bufferBetweenSlots: 0
  }
};

// Environment-specific configurations
export const DEVELOPMENT_CONFIG: Partial<HybridSlotConfig> = {
  performance: {
    cacheEnabled: false,
    cacheTTL: 60,
    maxConcurrentGenerations: 5
  },
  persistence: {
    enabled: true,
    popularityThreshold: 2,
    autoCleanup: true,
    cleanupAfterDays: 30
  }
};

export const PRODUCTION_CONFIG: Partial<HybridSlotConfig> = {
  performance: {
    cacheEnabled: true,
    cacheTTL: 600, // 10 minutes
    maxConcurrentGenerations: 20
  },
  persistence: {
    enabled: true,
    popularityThreshold: 10,
    autoCleanup: true,
    cleanupAfterDays: 60
  }
};

// Configuration factory
export class HybridSlotConfigFactory {
  static getConfig(environment: string = 'development'): HybridSlotConfig {
    let config = { ...DEFAULT_HYBRID_CONFIG };
    
    switch (environment.toLowerCase()) {
      case 'development':
        config = this.mergeConfig(config, DEVELOPMENT_CONFIG);
        break;
      case 'production':
        config = this.mergeConfig(config, PRODUCTION_CONFIG);
        break;
      case 'test':
        config = this.mergeConfig(config, {
          performance: { 
            cacheEnabled: false,
            cacheTTL: 60,
            maxConcurrentGenerations: 5
          },
          persistence: { 
            enabled: false,
            popularityThreshold: 1,
            autoCleanup: false,
            cleanupAfterDays: 1
          }
        });
        break;
    }
    
    return config;
  }
  
  private static mergeConfig(
    base: HybridSlotConfig,
    override: Partial<HybridSlotConfig>
  ): HybridSlotConfig {
    return {
      ...base,
      autoGenerate: { ...base.autoGenerate, ...override.autoGenerate },
      persistence: { ...base.persistence, ...override.persistence },
      performance: { ...base.performance, ...override.performance },
      businessRules: { ...base.businessRules, ...override.businessRules }
    };
  }
  
  static validateConfig(config: HybridSlotConfig): boolean {
    // Validate duration constraints
    if (config.defaultDuration < config.autoGenerate.minSlotDuration ||
        config.defaultDuration > config.autoGenerate.maxSlotDuration) {
      throw new Error('Default duration must be within min/max slot duration range');
    }
    
    // Validate cache TTL
    if (config.performance.cacheTTL < 0) {
      throw new Error('Cache TTL must be non-negative');
    }
    
    // Validate popularity threshold
    if (config.persistence.popularityThreshold < 1) {
      throw new Error('Popularity threshold must be at least 1');
    }
    
    // Validate cleanup days
    if (config.persistence.cleanupAfterDays < 1) {
      throw new Error('Cleanup after days must be at least 1');
    }
    
    return true;
  }
}

// Usage examples:
// const config = HybridSlotConfigFactory.getConfig(process.env.NODE_ENV);
// const isValid = HybridSlotConfigFactory.validateConfig(config);