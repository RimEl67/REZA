import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

export class DashboardController {
  async getApprovedReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getApprovedReviews(req.tenantId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRejectedReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getRejectedReviews(req.tenantId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getReviewStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dashboardService.getReviewStatistics(req.tenantId!);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
