"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageController = void 0;
const package_service_1 = require("./package.service");
class PackageController {
    packageService;
    constructor() {
        this.packageService = new package_service_1.PackageService();
    }
    createPackage = async (req, res) => {
        try {
            const packageData = req.body;
            const newPackage = await this.packageService.createPackage(packageData);
            res.status(201).json({
                success: true,
                message: 'Package created successfully',
                data: newPackage
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error creating package',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    getPackages = async (req, res) => {
        try {
            const { is_active } = req.query;
            const packages = await this.packageService.getAllPackages(is_active ? is_active === 'true' : undefined);
            res.status(200).json({
                success: true,
                data: packages
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching packages',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    getPackageById = async (req, res) => {
        try {
            const { id } = req.params;
            const packageData = await this.packageService.getPackageById(parseInt(id));
            if (!packageData) {
                res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: packageData
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error fetching package',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    updatePackage = async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const updatedPackage = await this.packageService.updatePackage(parseInt(id), updateData);
            if (!updatedPackage) {
                res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Package updated successfully',
                data: updatedPackage
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error updating package',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    deletePackage = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await this.packageService.deletePackage(parseInt(id));
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Package not found'
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Package deleted successfully'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error deleting package',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    getUserPackages = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
                return;
            }
            const userPackages = await this.packageService.getUserPackages(userId);
            res.status(200).json({
                success: true,
                message: 'Paquetes del usuario obtenidos exitosamente',
                data: userPackages
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener los paquetes del usuario',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
exports.PackageController = PackageController;
