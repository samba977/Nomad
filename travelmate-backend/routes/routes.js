const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const blogRoutes = require('./blogRoutes');
const travelPlanRoutes = require('./travelPlanRoutes');
const chatRoutes = require('./chatRoutes');
const groupRoutes = require('./groupRoutes');

router.use('/users', userRoutes);
router.use('/blogs', blogRoutes);
router.use('/travel-plans', travelPlanRoutes);
router.use('/chat', chatRoutes);
router.use('/groups', groupRoutes);

module.exports = router;
