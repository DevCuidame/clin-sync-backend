"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const package_controller_1 = require("./package.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const packageController = new package_controller_1.PackageController();
// Public routes
router.get('/', packageController.getPackages);
router.get('/:id', packageController.getPackageById);
// Protected routes (require authentication)
router.use((0, auth_middleware_1.restrictTo)('admin'));
router.get('/', packageController.getPackages);
router.get('/user/packages', auth_middleware_1.authMiddleware, packageController.getUserPackages);
router.post('/', auth_middleware_1.authMiddleware, packageController.createPackage);
router.put('/:id', auth_middleware_1.authMiddleware, packageController.updatePackage);
router.delete('/:id', auth_middleware_1.authMiddleware, packageController.deletePackage);
exports.default = router;
