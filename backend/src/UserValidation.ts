import { z } from "zod";

export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(100, "Email must be at most 100 characters")
    .trim()
    .toLowerCase(),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  username: z.string().trim().optional(),
  email: z.string().email().trim().toLowerCase().optional(),
  password: z.string().min(1, "Password is required"),
}).refine((data) => data.username || data.email, {
  message: "Either username or email is required",
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  username: z.string().min(3).max(30).optional(),
});
