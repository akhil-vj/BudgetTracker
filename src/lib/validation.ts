import { z } from 'zod';

// Transaction validation schema
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' }),
  }),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed 999,999.99'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category name too long'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description cannot exceed 200 characters'),
  date: z.string()
    .refine(
      (date) => !isNaN(Date.parse(date)) && new Date(date) <= new Date(),
      'Date cannot be in the future'
    ),
  paymentMethod: z.string().optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;

// Budget validation schema
export const budgetSchema = z.object({
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category name too long'),
  limit: z.number()
    .positive('Budget limit must be greater than 0')
    .max(999999.99, 'Budget cannot exceed 999,999.99'),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// Password validation schema
export const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

export type PasswordFormData = z.infer<typeof passwordSchema>;

// Sign up validation schema
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// Sign in validation schema
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInFormData = z.infer<typeof signInSchema>;

/**
 * Validates data and returns errors if invalid
 */
export function validateTransaction(data: unknown) {
  const result = transactionSchema.safeParse(data);
  return result;
}

export function validateBudget(data: unknown) {
  const result = budgetSchema.safeParse(data);
  return result;
}

export function validatePassword(data: unknown) {
  const result = passwordSchema.safeParse(data);
  return result;
}

export function validateSignUp(data: unknown) {
  const result = signUpSchema.safeParse(data);
  return result;
}

export function validateSignIn(data: unknown) {
  const result = signInSchema.safeParse(data);
  return result;
}
