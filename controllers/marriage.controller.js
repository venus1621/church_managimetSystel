const asyncHandler = require('express-async-handler');
const Marriage = require('../models/Marriage'); // Adjust path
const Believer = require('../models/Believer'); // Adjust path
const Atbiya = require('../models/Atbiya'); // Adjust path

// @desc    Create a new Marriage
// @route   POST /api/marriages
// @access  Private (Admin only)
const createMarriage = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { husband, wife, marriageDate, marriagePlace, churchOfMarriage, isActive, divorceDate, divorceReason } = req.body;

  // Validate required fields
  if (!husband || !wife || !marriageDate) {
    res.status(400);
    throw new Error('Husband, wife, and marriage date are required.');
  }

  // Validate husband and wife exist
  const husbandDoc = await Believer.findById(husband);
  const wifeDoc = await Believer.findById(wife);
  if (!husbandDoc || !wifeDoc) {
    res.status(400);
    throw new Error('Invalid husband or wife ID.');
  }

  // Validate husband is male
  if (husbandDoc.gender !== 'Male') {
    res.status(400);
    throw new Error('Husband must be male.');
  }

  // Validate wife is female
  if (wifeDoc.gender !== 'Female') {
    res.status(400);
    throw new Error('Wife must be female.');
  }

  // Validate churchOfMarriage if provided
  if (churchOfMarriage) {
    const church = await Atbiya.findById(churchOfMarriage);
    if (!church) {
      res.status(400);
      throw new Error('Invalid Atbiya ID.');
    }
  }

  // Create marriage
  const marriage = await Marriage.create({
    husband,
    wife,
    marriageDate,
    marriagePlace,
    churchOfMarriage,
    isActive: isActive !== undefined ? isActive : true,
    divorceDate,
    divorceReason,
  });

  // Populate references for response
  await marriage.populate('husband wife churchOfMarriage');

  res.status(201).json({
    success: true,
    data: marriage,
    message: 'Marriage created successfully.',
  });
});

// @desc    Update an existing Marriage
// @route   PUT /api/marriages/:id
// @access  Private (Admin only)
const updateMarriage = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { id } = req.params;
  const { marriageDate, marriagePlace, isActive, divorceDate, divorceReason, churchOfMarriage } = req.body;

  // Find the marriage
  const marriage = await Marriage.findById(id);
  if (!marriage) {
    res.status(404);
    throw new Error('Marriage not found.');
  }

  // Validate churchOfMarriage if provided
  if (churchOfMarriage) {
    const church = await Atbiya.findById(churchOfMarriage);
    if (!church) {
      res.status(400);
      throw new Error('Invalid Atbiya ID.');
    }
  }

  // Update fields if provided
  if (marriageDate) marriage.marriageDate = marriageDate;
  if (marriagePlace !== undefined) marriage.marriagePlace = marriagePlace;
  if (isActive !== undefined) marriage.isActive = isActive;
  if (divorceDate !== undefined) marriage.divorceDate = divorceDate;
  if (divorceReason !== undefined) marriage.divorceReason = divorceReason;
  if (churchOfMarriage !== undefined) marriage.churchOfMarriage = churchOfMarriage;

  // Save updated marriage
  const updatedMarriage = await marriage.save();

  // Populate references for response
  await updatedMarriage.populate('husband wife churchOfMarriage');

  res.status(200).json({
    success: true,
    data: updatedMarriage,
    message: 'Marriage updated successfully.',
  });
});

// @desc    Record a divorce for an existing Marriage
// @route   PUT /api/marriages/:id/divorce
// @access  Private (Admin only)
const recordDivorce = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { id } = req.params;
  const { divorceDate, divorceReason } = req.body;

  // Validate required fields
  if (!divorceDate) {
    res.status(400);
    throw new Error('Divorce date is required.');
  }

  // Find the marriage
  const marriage = await Marriage.findById(id);
  if (!marriage) {
    res.status(404);
    throw new Error('Marriage not found.');
  }

  // Update divorce details
  marriage.isActive = false;
  marriage.divorceDate = divorceDate;
  if (divorceReason !== undefined) marriage.divorceReason = divorceReason;

  // Save updated marriage
  const updatedMarriage = await marriage.save();

  // Populate references for response
  await updatedMarriage.populate('husband wife churchOfMarriage');

  res.status(200).json({
    success: true,
    data: updatedMarriage,
    message: 'Divorce recorded successfully.',
  });
});

// @desc    Get all marriages with optional filtering, sorting, and pagination
// @route   GET /api/marriages
// @access  Private (Admin only)
const getMarriages = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  // Build query
  const query = {};

  // Filter by isActive
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Filter by churchOfMarriage
  if (req.query.churchOfMarriage) {
    const church = await Atbiya.findById(req.query.churchOfMarriage);
    if (!church) {
      res.status(400);
      throw new Error('Invalid Atbiya ID.');
    }
    query.churchOfMarriage = req.query.churchOfMarriage;
  }

  // Filter by marriage date range
  if (req.query.startDate || req.query.endDate) {
    query.marriageDate = {};
    if (req.query.startDate) query.marriageDate.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.marriageDate.$lte = new Date(req.query.endDate);
  }

  // Filter by search term (marriagePlace or divorceReason)
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by husband
  if (req.query.husband) {
    const husband = await Believer.findById(req.query.husband);
    if (!husband) {
      res.status(400);
      throw new Error('Invalid husband ID.');
    }
    query.husband = req.query.husband;
  }

  // Filter by wife
  if (req.query.wife) {
    const wife = await Believer.findById(req.query.wife);
    if (!wife) {
      res.status(400);
      throw new Error('Invalid wife ID.');
    }
    query.wife = req.query.wife;
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sorting
  const sort = req.query.sort || '-marriageDate'; // Default: newest first

  // Execute query
  const marriages = await Marriage.find(query)
    .populate('husband wife churchOfMarriage')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const total = await Marriage.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      marriages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Marriages retrieved successfully.',
  });
});

module.exports = {
  createMarriage,
  updateMarriage,
  recordDivorce,
  getMarriages,
};