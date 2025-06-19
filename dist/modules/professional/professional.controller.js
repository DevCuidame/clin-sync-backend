"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfessionalController = void 0;
const professional_service_1 = require("./professional.service");
class ProfessionalController {
    professionalService;
    constructor() {
        this.professionalService = new professional_service_1.ProfessionalService();
    }
    async createProfessional(req, res) {
        try {
            const professionalData = req.body;
            const professional = await this.professionalService.createProfessional(professionalData);
            res.status(201).json({
                success: true,
                data: professional,
                message: 'Professional created successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating professional',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProfessionals(req, res) {
        try {
            const professionals = await this.professionalService.getAllProfessionals();
            res.status(200).json({
                success: true,
                data: professionals
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching professionals',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async getProfessionalById(req, res) {
        try {
            const { id } = req.params;
            const professional = await this.professionalService.getProfessionalById(parseInt(id));
            if (!professional) {
                res.status(404).json({
                    success: false,
                    message: 'Professional not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: professional
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching professional',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async updateProfessional(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const professional = await this.professionalService.updateProfessional(parseInt(id), updateData);
            res.status(200).json({
                success: true,
                data: professional,
                message: 'Professional updated successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating professional',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async deleteProfessional(req, res) {
        try {
            const { id } = req.params;
            await this.professionalService.deleteProfessional(parseInt(id));
            res.status(200).json({
                success: true,
                message: 'Professional deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting professional',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.ProfessionalController = ProfessionalController;
