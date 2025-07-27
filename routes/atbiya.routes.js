const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createAtbiya,
  updateAtbiya,
  getAtbiyas,
  getAtbiyasByWeredaId
} = require('../controllers/atbiya.controller');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/atbiyas
 * @desc    Create a new Atbiya
 * @access  Private (Admin only)
 */
router.post('/', createAtbiya);

/**
 * @route   PUT /api/atbiyas/:id
 * @desc    Update an Atbiya
 * @access  Private (Admin only)
 */
router.put('/:id', updateAtbiya);

/**
 * @route   GET /api/atbiyas
 * @desc    Get all Atbiyas with filters
 * @access  Private (Admin only)
 */
router.get('/', getAtbiyas);

/**
 * @route   GET /api/atbiyas/by-wereda/:weredaId
 * @desc    Get Atbiyas by WeredaBetekihinet ID
 * @access  Private (Admin + wereda_admin)
 */
router.get('/by-wereda/:weredaId', getAtbiyasByWeredaId);

module.exports = router;
