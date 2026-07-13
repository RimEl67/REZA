import express from 'express';
import { familyMemberController } from './familyMember.controller';

const router = express.Router();

router.get('/', familyMemberController.getFamilyMembers);
router.post('/', familyMemberController.createFamilyMember);
router.put('/:id', familyMemberController.updateFamilyMember);
router.delete('/:id', familyMemberController.deleteFamilyMember);

export default router;
