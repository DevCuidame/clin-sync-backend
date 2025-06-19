"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationController = void 0;
const location_service_1 = require("./location.service");
class LocationController {
    locationService;
    constructor() {
        this.locationService = new location_service_1.LocationService();
    }
    /**
     * Obtener todos los departamentos
     * @route GET /api/locations/departments
     */
    getDepartments = async (req, res, next) => {
        try {
            const departments = await this.locationService.getAllDepartments();
            const response = {
                success: true,
                data: departments,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Obtener ciudades por departamento
     * @route GET /api/locations/townships/:departmentId
     */
    getTownshipsByDepartment = async (req, res, next) => {
        try {
            const departmentId = parseInt(req.params.departmentId);
            const townships = await this.locationService.getTownshipsByDepartment(departmentId);
            const response = {
                success: true,
                data: townships,
                timestamp: new Date().toISOString()
            };
            res.status(200).json(response);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.LocationController = LocationController;
