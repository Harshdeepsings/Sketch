import {z} from "zod";

export const UserSchema = z.object({
    username: z.string().min(3).max(20).trim(),
    password: z.string().min(6).max(20).trim().toLowerCase(),
    email: z.string().email().min(5).max(30).trim().toLowerCase()
})