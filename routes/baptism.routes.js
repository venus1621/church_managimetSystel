const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createBaptism,
  updateBaptism,
  getBaptisms
} = require('../controllers/baptism.controller');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/baptisms
 * @desc    Create a new baptism record
 * @access  Private (Admin or Wereda Admin with valid church)
 */
router.post('/', createBaptism);

/**
 * @route   PUT /api/baptisms/:id
 * @desc    Update an existing baptism record
 * @access  Private (Admin or Wereda Admin if within scope)
 */
router.put('/:id', updateBaptism);

/**
 * @route   GET /api/baptisms
 * @desc    Get all baptism records (filtered by wereda if wereda_admin)
 * @access  Private
 */
router.get('/', getBaptisms);

module.exports = router;
