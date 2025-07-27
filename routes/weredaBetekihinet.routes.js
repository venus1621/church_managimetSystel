const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createWeredaBetekihinet,
  updateWeredaBetekihinet
} = require('../controllers/WeredaBetekihinet.controller');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/wereda-betekihinet
 * @desc    Create a new Wereda Betekihinet
 * @access  Private (Admin only)
 */
router.post('/', createWeredaBetekihinet);

/**
 * @route   PUT /api/wereda-betekihinet/:id
 * @desc    Update an existing Wereda Betekihinet
 * @access  Private (Admin only)
 */
router.put('/:id', updateWeredaBetekihinet);

module.exports = router;
