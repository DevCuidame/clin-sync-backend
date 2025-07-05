import { Router } from 'express';
import { ProfessionalController } from './professional.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();
const professionalController = new ProfessionalController();

// Rutas públicas
router.get('/', professionalController.getProfessionals.bind(professionalController));
router.get('/:id', professionalController.getProfessionalById.bind(professionalController));

// Rutas protegidas
router.use(authMiddleware);

router.get('/complete-info/:user_id', professionalController.getProfessionalCompleteInfoByUserId.bind(professionalController));
router.post('/', professionalController.createProfessional.bind(professionalController));
router.put('/:id', professionalController.updateProfessional.bind(professionalController));
router.delete('/:id', professionalController.deleteProfessional.bind(professionalController));

export { router as professionalRoutes };