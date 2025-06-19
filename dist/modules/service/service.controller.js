"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceController = void 0;
const service_service_1 = require("./service.service");
class ServiceController {
    serviceService;
    constructor() {
        this.serviceService = new service_service_1.ServiceService();
    }
    async createService(req, res) {
        try {
            const serviceData = req.body;
            const service = await this.serviceService.createService(serviceData);
            res.status(201).json({
                success: true,
                data: service,
                message: 'Service created successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getServices(req, res) {
        try {
            const { category, is_active } = req.query;
            const services = await this.serviceService.getServices({
                category: category,
                is_active: is_active === 'true'
            });
            res.status(200).json({
                success: true,
                data: services
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching services',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getAllServices(req, res) {
        try {
            const services = await this.serviceService.getAllServices();
            res.status(200).json({
                success: true,
                data: services
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching services',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getServiceById(req, res) {
        try {
            const { id } = req.params;
            const service = await this.serviceService.getServiceById(parseInt(id));
            if (!service) {
                res.status(404).json({
                    success: false,
                    message: 'Service not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: service
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateService(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const service = await this.serviceService.updateService(parseInt(id), updateData);
            res.status(200).json({
                success: true,
                data: service,
                message: 'Service updated successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteService(req, res) {
        try {
            const { id } = req.params;
            await this.serviceService.deleteService(parseInt(id));
            res.status(200).json({
                success: true,
                message: 'Service deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting service',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.ServiceController = ServiceController;
