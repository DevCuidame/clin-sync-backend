"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const service_controller_1 = require("./service.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
const serviceController = new service_controller_1.ServiceController();
// Public routes
router.get('/actives', (req, res) => serviceController.getServices(req, res));
router.get('/:id', (req, res) => serviceController.getServiceById(req, res));
// Protected routes (require authentication)
router.use(auth_middleware_1.authMiddleware);
router.use((0, role_middleware_1.restrictTo)(['admin']));
router.get('/', (req, res) => serviceController.getAllServices(req, res));
router.post('/', auth_middleware_1.authMiddleware, (req, res) => serviceController.createService(req, res));
router.put('/:id', auth_middleware_1.authMiddleware, (req, res) => serviceController.updateService(req, res));
router.delete('/:id', auth_middleware_1.authMiddleware, (req, res) => serviceController.deleteService(req, res));
exports.default = router;
