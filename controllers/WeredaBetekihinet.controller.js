const WeredaBetekihinet = require('../models/WeredaBetekihinet');
const asyncHandler = require('express-async-handler');

// @desc    Create a new WeredaBetekihinet
// @route   POST /api/wereda-betekihinet
// @access  Private (Admin only)
const createWeredaBetekihinet = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { name, address } = req.body;

  if (!name || !address || !address.region || !address.zone || !address.woreda || !address.kebele) {
    res.status(400);
    throw new Error('Please provide name, region, zone, woreda, and kebele.');
  }

  const weredaBetekihinet = await WeredaBetekihinet.create({
    name,
    address: {
      region: address.region,
      zone: address.zone,
      woreda: address.woreda,
      kebele: address.kebele,
    },
  });

  res.status(201).json({
    success: true,
    data: weredaBetekihinet,
    message: 'Wereda Betekihinet created successfully.',
  });
});

// @desc    Update an existing WeredaBetekihinet
// @route   PUT /api/wereda-betekihinet/:id
// @access  Private (Admin only)
const updateWeredaBetekihinet = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { id } = req.params;
  const { name, address } = req.body;

  const weredaBetekihinet = await WeredaBetekihinet.findById(id);
  if (!weredaBetekihinet) {
    res.status(404);
    throw new Error('Wereda Betekihinet not found.');
  }

  if (name) weredaBetekihinet.name = name;
  if (address) {
    weredaBetekihinet.address = {
      region: address.region || weredaBetekihinet.address.region,
      zone: address.zone || weredaBetekihinet.address.zone,
      woreda: address.woreda || weredaBetekihinet.address.woreda,
      kebele: address.kebele || weredaBetekihinet.address.kebele,
    };
  }

  const updatedWeredaBetekihinet = await weredaBetekihinet.save();

  res.status(200).json({
    success: true,
    data: updatedWeredaBetekihinet,
    message: 'Wereda Betekihinet updated successfully.',
  });
});

// @desc    Get all WeredaBetekihinet records
// @route   GET /api/wereda-betekihinet
// @access  Private (Admin only)
const getAllWeredaBetekihinet = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const query = {};

  if (req.query.name) {
    query.name = { $regex: req.query.name, $options: 'i' };
  }

  if (req.query.region) {
    query['address.region'] = { $regex: req.query.region, $options: 'i' };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || 'name';

  const records = await WeredaBetekihinet.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await WeredaBetekihinet.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Wereda Betekihinet records retrieved successfully.',
  });
});

module.exports = {
  createWeredaBetekihinet,
  updateWeredaBetekihinet,
  getAllWeredaBetekihinet,
};
