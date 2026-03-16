import { Router } from 'express';
import { register, login, refreshToken, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

export default router;
