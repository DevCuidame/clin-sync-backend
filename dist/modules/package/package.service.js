"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageService = void 0;
const database_1 = require("../../core/config/database");
const package_model_1 = require("../../models/package.model");
const purchase_model_1 = require("../../models/purchase.model");
class PackageService {
    packageRepository;
    constructor() {
        this.packageRepository = database_1.AppDataSource.getRepository(package_model_1.Package);
    }
    async createPackage(packageData) {
        const newPackage = this.packageRepository.create({
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            total_sessions: packageData.total_sessions,
            validity_days: packageData.validity_days,
            discount_percentage: packageData.discount_percentage,
            is_active: packageData.is_active ?? true,
            terms_conditions: packageData.terms_conditions,
            image_url: packageData.image_url
        });
        const savedPackage = await this.packageRepository.save(newPackage);
        return this.mapToResponseDto(savedPackage);
    }
    async getAllPackages(isActive) {
        const queryBuilder = this.packageRepository.createQueryBuilder('package');
        if (isActive !== undefined) {
            queryBuilder.where('package.is_active = :isActive', { isActive });
        }
        queryBuilder.orderBy('package.created_at', 'DESC');
        const packages = await queryBuilder.getMany();
        return packages.map(pkg => this.mapToResponseDto(pkg));
    }
    async getPackageById(packageId) {
        const packageData = await this.packageRepository.findOne({
            where: { package_id: packageId }
        });
        if (!packageData) {
            return null;
        }
        return this.mapToResponseDto(packageData);
    }
    async updatePackage(packageId, updateData) {
        const existingPackage = await this.packageRepository.findOne({
            where: { package_id: packageId }
        });
        if (!existingPackage) {
            return null;
        }
        // Update only provided fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                existingPackage[key] = updateData[key];
            }
        });
        existingPackage.updated_at = new Date();
        const updatedPackage = await this.packageRepository.save(existingPackage);
        return this.mapToResponseDto(updatedPackage);
    }
    async deletePackage(packageId) {
        const result = await this.packageRepository.delete({ package_id: packageId });
        return result.affected !== null && result.affected !== undefined && result.affected > 0;
    }
    async getActivePackages() {
        return this.getAllPackages(true);
    }
    async togglePackageStatus(packageId) {
        const packageData = await this.packageRepository.findOne({
            where: { package_id: packageId }
        });
        if (!packageData) {
            return null;
        }
        packageData.is_active = !packageData.is_active;
        packageData.updated_at = new Date();
        const updatedPackage = await this.packageRepository.save(packageData);
        return this.mapToResponseDto(updatedPackage);
    }
    async getPackagesByPriceRange(minPrice, maxPrice) {
        const packages = await this.packageRepository
            .createQueryBuilder('package')
            .where('package.price >= :minPrice AND package.price <= :maxPrice', { minPrice, maxPrice })
            .andWhere('package.is_active = :isActive', { isActive: true })
            .orderBy('package.price', 'ASC')
            .getMany();
        return packages.map(pkg => this.mapToResponseDto(pkg));
    }
    async getUserPackages(userId) {
        const purchaseRepository = database_1.AppDataSource.getRepository(purchase_model_1.Purchase);
        const userPurchases = await purchaseRepository
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.package', 'package')
            .where('purchase.user_id = :userId', { userId })
            .andWhere('purchase.payment_status = :status', { status: 'completed' })
            .orderBy('purchase.purchase_date', 'DESC')
            .getMany();
        return userPurchases.map(purchase => ({
            purchase_id: purchase.purchase_id,
            amount_paid: purchase.amount_paid,
            payment_status: purchase.payment_status,
            payment_method: purchase.payment_method,
            transaction_id: purchase.transaction_id,
            purchase_date: purchase.purchase_date,
            expires_at: purchase.expires_at,
            package: this.mapToResponseDto(purchase.package)
        }));
    }
    mapToResponseDto(packageData) {
        return {
            package_id: packageData.package_id,
            package_name: packageData.package_name,
            description: packageData.description,
            price: packageData.price,
            total_sessions: packageData.total_sessions,
            validity_days: packageData.validity_days,
            discount_percentage: packageData.discount_percentage,
            is_active: packageData.is_active,
            terms_conditions: packageData.terms_conditions,
            image_url: packageData.image_url,
            created_at: packageData.created_at,
            updated_at: packageData.updated_at
        };
    }
}
exports.PackageService = PackageService;
