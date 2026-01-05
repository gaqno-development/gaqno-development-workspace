import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

