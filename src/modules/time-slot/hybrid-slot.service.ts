import { TimeSlotService } from './time-slot.service';
import { DynamicSlotService } from './dynamic-slot.service';
import { CreateTimeSlotDto, TimeSlotFilterDto, TimeSlotResponseDto } from './time-slot.interface';
import { SlotStatus } from '../../models/time-slot.model';
import { HybridSlotConfig, HybridSlotConfigFactory } from './hybrid-slot.config';

export interface HybridSlotOptions {
  defaultDuration?: number;
  autoGenerate?: boolean;
  persistPopular?: boolean;
  maxVirtualSlots?: number;
}

export class HybridSlotService {
  private timeSlotService: TimeSlotService;
  private dynamicSlotService: DynamicSlotService;
  private config: HybridSlotConfig;

  constructor(config?: HybridSlotConfig) {
    this.timeSlotService = new TimeSlotService();
    this.dynamicSlotService = new DynamicSlotService();
    this.config = config || HybridSlotConfigFactory.getConfig(process.env.NODE_ENV || 'development');
    
    // Validate configuration
    HybridSlotConfigFactory.validateConfig(this.config);
  }

  async getAvailableSlots(
    professionalId: number,
    startDate: string,
    endDate?: string,
    options: HybridSlotOptions = {}
  ): Promise<{
    slots: TimeSlotResponseDto[];
    isGenerated: boolean;
    totalCount: number;
  }> {
    const {
      defaultDuration = 30,
      autoGenerate = true,
      persistPopular = false,
      maxVirtualSlots = 50
    } = options;

    try {
      // 1. Buscar slots existentes
      const filters: TimeSlotFilterDto = {
        start_date: startDate,
        end_date: endDate,
        available_only: true
      };

      const existingSlots = await this.timeSlotService.getTimeSlotsByProfessional(
        professionalId,
        filters
      );

      // 2. Si hay slots existentes, devolverlos
      if (existingSlots.length > 0) {
        return {
          slots: existingSlots,
          isGenerated: false,
          totalCount: existingSlots.length
        };
      }

      // 3. Si no hay slots y autoGenerate está habilitado, generar dinámicamente
      if (autoGenerate && this.config.autoGenerate.enabled) {
        const virtualSlots = await this.generateSlotsForDateRange(
          professionalId,
          startDate,
          endDate,
          options.defaultDuration || this.config.defaultDuration,
          Math.min(maxVirtualSlots, this.config.autoGenerate.maxSlotsPerDay)
        );

        // 4. Opcionalmente, persistir slots populares
        if (persistPopular && virtualSlots.length > 0) {
          await this.persistPopularSlots(virtualSlots, professionalId);
        }

        return {
          slots: virtualSlots,
          isGenerated: true,
          totalCount: virtualSlots.length
        };
      }

      // 5. Si autoGenerate está deshabilitado, devolver array vacío
      return {
        slots: [],
        isGenerated: false,
        totalCount: 0
      };

    } catch (error) {
      console.error('Error in hybrid slot service:', error);
      return {
        slots: [],
        isGenerated: false,
        totalCount: 0
      };
    }
  }

  async getAvailabilityForDate(
    professionalId: number,
    date: string,
    duration: number = 30
  ): Promise<{
    isAvailable: boolean;
    slots: TimeSlotResponseDto[];
    isGenerated: boolean;
  }> {
    try {
      const result = await this.getAvailableSlots(
        professionalId,
        date,
        date,
        { defaultDuration: duration }
      );

      return {
        isAvailable: result.slots.length > 0,
        slots: result.slots,
        isGenerated: result.isGenerated
      };
    } catch (error) {
      console.error('Error checking availability for date:', error);
      return {
        isAvailable: false,
        slots: [],
        isGenerated: false
      };
    }
  }

  private async generateSlotsForDateRange(
    professionalId: number,
    startDate: string,
    endDate: string | undefined,
    duration: number,
    maxSlots: number
  ): Promise<TimeSlotResponseDto[]> {
    const slots: TimeSlotResponseDto[] = [];
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(startDate);

    // Asegurar que no generemos más de maxSlots
    let currentDate = new Date(start);
    let slotCount = 0;

    while (currentDate <= end && slotCount < maxSlots) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dailySlots = await this.dynamicSlotService.generateVirtualSlots(
        professionalId,
        dateStr,
        duration
      );

      // Agregar slots del día actual
      for (const slot of dailySlots) {
        if (slotCount >= maxSlots) break;
        slots.push(slot);
        slotCount++;
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return slots;
  }

  private async persistPopularSlots(
    virtualSlots: TimeSlotResponseDto[],
    professionalId: number
  ): Promise<void> {
    try {
      // Lógica para persistir slots que son frecuentemente consultados
      // Por ahora, persistimos los primeros 5 slots como ejemplo
      const slotsToPersist = virtualSlots.slice(0, 5);

      for (const virtualSlot of slotsToPersist) {
        try {
          await this.timeSlotService.createTimeSlot({
            professional_id: professionalId,
            slot_date: virtualSlot.slot_date,
            start_time: virtualSlot.start_time,
            end_time: virtualSlot.end_time,
            duration_minutes: virtualSlot.duration_minutes,
            status: SlotStatus.AVAILABLE,
            max_bookings: 1
          });
        } catch (error) {
          // Si falla la creación de un slot, continuar con los demás
          console.warn(`Failed to persist slot: ${virtualSlot.start_time}`, error);
        }
      }
    } catch (error) {
      console.error('Error persisting popular slots:', error);
    }
  }

  async getSlotStatistics(
    professionalId: number,
    startDate: string,
    endDate?: string
  ): Promise<{
    totalSlots: number;
    existingSlots: number;
    virtualSlots: number;
    availableSlots: number;
    bookedSlots: number;
  }> {
    try {
      const result = await this.getAvailableSlots(
        professionalId,
        startDate,
        endDate,
        { autoGenerate: true }
      );

      const existingSlots = await this.timeSlotService.getTimeSlotsByProfessional(
        professionalId,
        { start_date: startDate, end_date: endDate }
      );

      const availableCount = result.slots.filter(
        slot => slot.status === SlotStatus.AVAILABLE
      ).length;

      const bookedCount = existingSlots.filter(
        slot => slot.status === SlotStatus.BOOKED
      ).length;

      return {
        totalSlots: result.totalCount,
        existingSlots: existingSlots.length,
        virtualSlots: result.isGenerated ? result.totalCount : 0,
        availableSlots: availableCount,
        bookedSlots: bookedCount
      };
    } catch (error) {
      console.error('Error getting slot statistics:', error);
      return {
        totalSlots: 0,
        existingSlots: 0,
        virtualSlots: 0,
        availableSlots: 0,
        bookedSlots: 0
      };
    }
  }

  async preGenerateSlots(
    professionalId: number,
    startDate: string,
    endDate: string,
    duration: number = 30
  ): Promise<{
    generated: number;
    skipped: number;
    errors: number;
  }> {
    let generated = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        try {
          // Verificar si ya existen slots para esta fecha
          const existingSlots = await this.timeSlotService.getTimeSlotsByProfessional(
            professionalId,
            { start_date: dateStr, end_date: dateStr }
          );

          if (existingSlots.length > 0) {
            skipped++;
          } else {
            // Generar y persistir slots para esta fecha
            const virtualSlots = await this.dynamicSlotService.generateVirtualSlots(
              professionalId,
              dateStr,
              duration
            );

            for (const virtualSlot of virtualSlots) {
              try {
                await this.timeSlotService.createTimeSlot({
                  professional_id: professionalId,
                  slot_date: virtualSlot.slot_date,
                  start_time: virtualSlot.start_time,
                  end_time: virtualSlot.end_time,
                  duration_minutes: virtualSlot.duration_minutes,
                  status: SlotStatus.AVAILABLE,
                  max_bookings: 1
                });
                generated++;
              } catch (error) {
                errors++;
              }
            }
          }
        } catch (error) {
          errors++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (error) {
      console.error('Error in preGenerateSlots:', error);
    }

    return { generated, skipped, errors };
  }
}