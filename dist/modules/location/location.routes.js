"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("./location.controller");
const router = (0, express_1.Router)();
const locationController = new location_controller_1.LocationController();
/**
 * Routes that require authentication
 */
// router.use(authMiddleware);
/**
 * @route GET /api/locations/departments
 * @desc Get all departments
 * @access Private
 */
router.get('/departments', locationController.getDepartments);
/**
 * @route GET /api/locations/townships/:departmentId
 * @desc Get townships by department ID
 * @access Private
 */
router.get('/townships/:departmentId', locationController.getTownshipsByDepartment);
exports.default = router;
