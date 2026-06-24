// controllers/travelPlanController.js
const { z } = require('zod');
const TravelPlan = require('../models/TravelPlan');

const travelPlanSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  destination: z.string().min(1, 'Destination is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required')
});

const updateSchema = z.object({
  title: z.string().optional(),
  destination: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional()
});

const createTravelPlan = async (req, res) => {
  try {
    const data = travelPlanSchema.parse(req.body);
    const plan = new TravelPlan(data);
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Error creating travel plan:', err);
    res.status(500).json({ message: 'Failed to create travel plan' });
  }
};

const getUserTravelPlans = async (req, res) => {
  try {
    const plans = await TravelPlan.find({ userId: req.params.id }).sort({ date: 1 });
    res.status(200).json(plans);
  } catch (err) {
    console.error('Error fetching user plans:', err);
    res.status(500).json({ message: 'Failed to fetch travel plans' });
  }
};

const updateTravelPlan = async (req, res) => {
  try {
    const data = updateSchema.parse(req.body);
    const updated = await TravelPlan.findByIdAndUpdate(req.params.id, data, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error('Error updating travel plan:', err);
    res.status(500).json({ message: 'Failed to update travel plan' });
  }
};

const deleteTravelPlan = async (req, res) => {
  try {
    await TravelPlan.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Travel plan deleted' });
  } catch (err) {
    console.error('Error deleting travel plan:', err);
    res.status(500).json({ message: 'Failed to delete travel plan' });
  }
};

module.exports = {
  createTravelPlan,
  getUserTravelPlans,
  updateTravelPlan,
  deleteTravelPlan
};
