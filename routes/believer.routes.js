const express = require('express');
const { check } = require('express-validator');
const {
  getBelievers,
  getBeliever,
  createBeliever,
  updateBeliever,
  deleteBeliever,
  getBelieverStatistics
} = require('../controllers/believer.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/believers
// @desc    Get all believers (with RBAC filtering inside controller)
// @access  Private
router.get('/', getBelievers);

// @route   GET /api/believers/statistics
// @desc    Get statistics of believers (admin/wereda-scoped)
// @access  Private
router.get('/statistics', getBelieverStatistics);

// @route   GET /api/believers/:id
// @desc    Get single believer by ID
// @access  Private
router.get('/:id', getBeliever);

// @route   POST /api/believers
// @desc    Create a new believer
// @access  Private
router.post(
  '/',
  [
    check('firstName', 'First name is required').notEmpty(),
    check('lastName', 'Last name is required').notEmpty(),
    check('gender', 'Gender must be Male, Female, or Other').isIn(['Male', 'Female', 'Other']),
    check('dateOfBirth', 'Valid date of birth is required').isISO8601(),
    check('liveStatus', 'Live status must be valid').isIn(['Active', 'Inactive', 'Deceased', 'Transferred'])
  ],
  createBeliever
);

// @route   PUT /api/believers/:id
// @desc    Update existing believer
// @access  Private
router.put(
  '/:id',
  [
    check('firstName', 'First name is required').notEmpty(),
    check('lastName', 'Last name is required').notEmpty(),
    check('gender', 'Gender must be Male, Female, or Other').isIn(['Male', 'Female', 'Other']),
    check('dateOfBirth', 'Valid date of birth is required').isISO8601()
  ],
  updateBeliever
);

// @route   DELETE /api/believers/:id
// @desc    Delete a believer (Admins only - RBAC inside controller)
// @access  Private
router.delete('/:id', deleteBeliever);

module.exports = router;
