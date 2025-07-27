const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getDeaths,
  getDeath,
  createDeath,
  updateDeath,
  deleteDeath
} = require('../controllers/death.controller');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/deaths
 * @desc    Get all death records (RBAC-filtered for wereda_admin)
 * @access  Private
 */
router.get('/', getDeaths);

/**
 * @route   GET /api/deaths/:id
 * @desc    Get a single death record by ID
 * @access  Private
 */
router.get('/:id', getDeath);

/**
 * @route   POST /api/deaths
 * @desc    Create a new death record
 * @access  Private (Admin or Wereda Admin if church under their Wereda)
 */
router.post('/', createDeath);

/**
 * @route   PUT /api/deaths/:id
 * @desc    Update an existing death record
 * @access  Private (RBAC enforced in controller)
 */
router.put('/:id', updateDeath);

/**
 * @route   DELETE /api/deaths/:id
 * @desc    Delete a death record
 * @access  Private (Admin only)
 */
router.delete('/:id', deleteDeath);

module.exports = router;
