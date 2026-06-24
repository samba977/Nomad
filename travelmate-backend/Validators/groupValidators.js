const { z } = require('zod');
const mongoose = require('mongoose');

const groupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  members: z.array(
    z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
      message: 'Each member ID must be a valid ObjectId'
    })
  ).min(2, 'At least 2 members required'),
  createdBy: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid creator ID'
  })
});

module.exports = { groupSchema };
