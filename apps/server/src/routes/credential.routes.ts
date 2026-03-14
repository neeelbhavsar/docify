import { Router } from 'express';
import {
    getCredentials,
    createCredential,
    revealCredential,
    updateCredential,
    deleteCredential,
} from '../controllers/credential.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess);

router.get('/', getCredentials);
router.post('/', requireRole('OWNER', 'ADMIN', 'MEMBER'), createCredential);
router.get('/:credentialId/reveal', revealCredential);
router.patch('/:credentialId', requireRole('OWNER', 'ADMIN'), updateCredential);
router.delete('/:credentialId', requireRole('OWNER', 'ADMIN'), deleteCredential);

export default router;
