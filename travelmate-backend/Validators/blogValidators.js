const { z } = require('zod');
const mongoose = require('mongoose');

const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  authorId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid author ID'
  })
});

const blogUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional()
});

module.exports = {
  blogSchema,
  blogUpdateSchema
};
