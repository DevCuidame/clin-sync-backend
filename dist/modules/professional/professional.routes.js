"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.professionalRoutes = void 0;
const express_1 = require("express");
const professional_controller_1 = require("./professional.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
exports.professionalRoutes = router;
const professionalController = new professional_controller_1.ProfessionalController();
// Rutas públicas
router.get('/', professionalController.getProfessionals.bind(professionalController));
router.get('/:id', professionalController.getProfessionalById.bind(professionalController));
// Rutas protegidas
router.use(auth_middleware_1.authMiddleware);
router.post('/', professionalController.createProfessional.bind(professionalController));
router.put('/:id', professionalController.updateProfessional.bind(professionalController));
router.delete('/:id', professionalController.deleteProfessional.bind(professionalController));
