import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { familyMemberService } from './familyMember.service';
import { createFamilyMemberSchema, updateFamilyMemberSchema } from './familyMember.schema';

export class FamilyMemberController {
  async getFamilyMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(401).json({ error: 'User email not found' });
      }

      const familyMembers = await familyMemberService.getFamilyMembers(req.tenantId!, userEmail);
      res.json({ familyMembers });
    } catch (error) {
      next(error);
    }
  }

  async createFamilyMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFamilyMemberSchema.parse(req.body);
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({ error: 'User email not found' });
      }

      const familyMember = await familyMemberService.createFamilyMember(req.tenantId!, userEmail, data);
      res.status(201).json({ familyMember });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  async updateFamilyMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateFamilyMemberSchema.parse(req.body);
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({ error: 'User email not found' });
      }

      const familyMember = await familyMemberService.updateFamilyMember(req.tenantId!, userEmail, id, data);
      res.json({ familyMember });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'CLIENT_NOT_FOUND' || error.message === 'MEMBER_NOT_FOUND') {
        return res.status(404).json({ error: 'Not found' });
      }
      next(error);
    }
  }

  async deleteFamilyMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({ error: 'User email not found' });
      }

      await familyMemberService.deleteFamilyMember(req.tenantId!, userEmail, id);
      res.json({ message: 'Family member deleted successfully' });
    } catch (error: any) {
      if (error.message === 'CLIENT_NOT_FOUND' || error.message === 'MEMBER_NOT_FOUND') {
        return res.status(404).json({ error: 'Not found' });
      }
      next(error);
    }
  }
}

export const familyMemberController = new FamilyMemberController();
