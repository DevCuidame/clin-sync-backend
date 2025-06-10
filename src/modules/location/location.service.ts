import { Department, Township } from "../../models/location.model";
import { IDepartment, ITownship } from "../../modules/user/user.interface";
import { AppDataSource } from "../../core/config/database";

export class LocationService {
  private departmentRepository = AppDataSource.getRepository(Department);
  private townshipRepository = AppDataSource.getRepository(Township);

  /**
   * Obtener todos los departamentos
   * @returns Lista de departamentos
   */
  async getAllDepartments(): Promise<IDepartment[]> {
    const departments = await this.departmentRepository.find({
      order: {
        name: 'ASC'
      }
    });
    
    // Mapeamos a la interfaz
    return departments.map(dept => ({
      id: dept.id,
      name: dept.name
    }));
  }

  /**
   * Obtener ciudades/municipios por departamento
   * @param departmentId ID del departamento
   * @returns Lista de ciudades/municipios
   */
  async getTownshipsByDepartment(departmentId: number): Promise<ITownship[]> {
    const townships = await this.townshipRepository.find({
      where: {
        department_id: departmentId
      },
      order: {
        name: 'ASC'
      }
    });
    
    // Mapeamos a la interfaz
    return townships.map(town => ({
      id: town.id,
      department_id: town.department_id,
      code: town.code,
      name: town.name
    }));
  }
}