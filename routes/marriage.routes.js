const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createMarriage,
  updateMarriage,
  recordDivorce,
  getMarriages
} = require('../controllers/marriage.controller');

// All routes are protected
router.use(auth);

/**
 * @route   POST /api/marriages
 * @desc    Create a new marriage record
 * @access  Private (Admin only)
 */
router.post('/', createMarriage);

/**
 * @route   PUT /api/marriages/:id
 * @desc    Update an existing marriage record
 * @access  Private (Admin only)
 */
router.put('/:id', updateMarriage);

/**
 * @route   PUT /api/marriages/:id/divorce
 * @desc    Record a divorce in an existing marriage
 * @access  Private (Admin only)
 */
router.put('/:id/divorce', recordDivorce);

/**
 * @route   GET /api/marriages
 * @desc    Get all marriage records with filters and pagination
 * @access  Private (Admin only)
 */
router.get('/', getMarriages);

module.exports = router;
