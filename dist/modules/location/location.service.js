"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const location_model_1 = require("../../models/location.model");
const database_1 = require("../../core/config/database");
class LocationService {
    departmentRepository = database_1.AppDataSource.getRepository(location_model_1.Department);
    townshipRepository = database_1.AppDataSource.getRepository(location_model_1.Township);
    /**
     * Obtener todos los departamentos
     * @returns Lista de departamentos
     */
    async getAllDepartments() {
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
    async getTownshipsByDepartment(departmentId) {
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
exports.LocationService = LocationService;
