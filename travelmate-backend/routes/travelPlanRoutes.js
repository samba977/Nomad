const express = require('express');
const router = express.Router();

const {
  createTravelPlan,
  getUserTravelPlans,
  updateTravelPlan,
  deleteTravelPlan
} = require('../controllers/travelController');

// ✅ POST: Create new travel plan
router.post('/', createTravelPlan);

// ✅ GET: All travel plans by a specific user
router.get('/user/:id', getUserTravelPlans);

// ✅ PUT: Update a specific travel plan
router.put('/:id', updateTravelPlan);

// ✅ DELETE: Delete a specific travel plan
router.delete('/:id', deleteTravelPlan);

module.exports = router;
