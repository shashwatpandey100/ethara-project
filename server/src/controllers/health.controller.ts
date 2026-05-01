import { Request, Response } from "express";

export const getHealth = (_req: Request, res: Response): void => {
  res.json({ success: true, message: "TaskScribe API is running", timestamp: new Date().toISOString() });
};
