import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "src/config/data-source";
import { Form } from "src/entities";

export const getAllFormsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formRepository = AppDataSource.getRepository(Form);
    const forms = await formRepository.find({
      relations: ["user"],
    });
    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};

