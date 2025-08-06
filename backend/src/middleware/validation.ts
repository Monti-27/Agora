import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'array';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}

export const validateRequest = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    const data = { ...req.body, ...req.query, ...req.params };

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${rule.field} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`${rule.field} must be a number`);
            }
            break;
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (typeof value !== 'string' || !emailRegex.test(value)) {
              errors.push(`${rule.field} must be a valid email address`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${rule.field} must be an array`);
            }
            break;
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be at most ${rule.maxLength} characters long`);
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} format is invalid`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
      return;
    }

    next();
  };
};

// Common validation patterns
export const emailValidation: ValidationRule = {
  field: 'email',
  required: true,
  type: 'email',
};

export const passwordValidation: ValidationRule = {
  field: 'password',
  required: true,
  type: 'string',
  minLength: 6,
  maxLength: 100,
};

export const usernameValidation: ValidationRule = {
  field: 'username',
  required: true,
  type: 'string',
  minLength: 3,
  maxLength: 50,
  pattern: /^[a-zA-Z0-9_-]+$/,
};
