const { z } = require('zod');
const mongoose = require('mongoose');

const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  citizenshipId: z.string().regex(/^\d{8,12}$/, 'Citizenship ID must be 8 to 12 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const profileSchema = z.object({
  userId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid user ID'
  }),
  bio: z.string().optional(),
  contactNo: z.string().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  profileSchema
};
