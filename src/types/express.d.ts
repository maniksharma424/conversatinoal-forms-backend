import { Form } from "../entities/formEntity.js";

// This extends the Express namespace to include compatibility with our User type
declare global {
  namespace Express {
    // Extend the Express User interface to include all properties from our User entity
    interface User {
      id: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      isVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
      forms: Form[];
    }
  }
}
