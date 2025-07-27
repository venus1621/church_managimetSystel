const asyncHandler = require('express-async-handler');
const Atbiya = require('../models/Atbiya');
const WeredaBetekihinet = require('../models/WeredaBetekihinet');

// @desc    Create a new Atbiya record
// @route   POST /api/atbiyas
// @access  Private (Admin only)
const createAtbiya = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { name, address, contactPerson, under } = req.body;

  if (!name || !address?.region || !under) {
    res.status(400);
    throw new Error('Name, region, and under are required.');
  }

  const wereda = await WeredaBetekihinet.findById(under);
  if (!wereda) {
    res.status(400);
    throw new Error('Invalid WeredaBetekihinet ID.');
  }

  if (contactPerson?.phone && !/^\+?\d{10,15}$/.test(contactPerson.phone)) {
    res.status(400);
    throw new Error('Invalid contact person phone number format.');
  }

  const existingAtbiya = await Atbiya.findOne({ name });
  if (existingAtbiya) {
    res.status(400);
    throw new Error('Atbiya with this name already exists.');
  }

  const atbiya = await Atbiya.create({ name, address, contactPerson, under });
  await atbiya.populate('under');

  res.status(201).json({
    success: true,
    data: atbiya,
    message: 'Atbiya record created successfully.',
  });
});

// @desc    Update an existing Atbiya record
// @route   PUT /api/atbiyas/:id
// @access  Private (Admin only)
const updateAtbiya = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'Admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { id } = req.params;
  const { name, address, contactPerson, under } = req.body;

  const atbiya = await Atbiya.findById(id);
  if (!atbiya) {
    res.status(404);
    throw new Error('Atbiya record not found.');
  }

  if (under) {
    const wereda = await WeredaBetekihinet.findById(under);
    if (!wereda) {
      res.status(400);
      throw new Error('Invalid WeredaBetekihinet ID.');
    }
  }

  if (contactPerson?.phone && !/^\+?\d{10,15}$/.test(contactPerson.phone)) {
    res.status(400);
    throw new Error('Invalid contact person phone number format.');
  }

  if (name && name !== atbiya.name) {
    const existingAtbiya = await Atbiya.findOne({ name });
    if (existingAtbiya) {
      res.status(400);
      throw new Error('Atbiya with this name already exists.');
    }
  }

  if (name) atbiya.name = name;
  if (address) {
    if (address.region) atbiya.address.region = address.region;
    if (address.zone !== undefined) atbiya.address.zone = address.zone;
    if (address.woreda !== undefined) atbiya.address.woreda = address.woreda;
    if (address.kebele !== undefined) atbiya.address.kebele = address.kebele;
  }
  if (contactPerson) {
    if (contactPerson.name !== undefined) atbiya.contactPerson.name = contactPerson.name;
    if (contactPerson.phone !== undefined) atbiya.contactPerson.phone = contactPerson.phone;
    if (contactPerson.role !== undefined) atbiya.contactPerson.role = contactPerson.role;
  }
  if (under) atbiya.under = under;

  const updatedAtbiya = await atbiya.save();
  await updatedAtbiya.populate('under');

  res.status(200).json({
    success: true,
    data: updatedAtbiya,
    message: 'Atbiya record updated successfully.',
  });
});

// @desc    Get all Atbiya records with filtering and pagination
// @route   GET /api/atbiyas
// @access  Private (Admin only)
const getAtbiyas = asyncHandler(async (req, res) => {
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

  if (req.query.under) {
    const wereda = await WeredaBetekihinet.findById(req.query.under);
    if (!wereda) {
      res.status(400);
      throw new Error('Invalid WeredaBetekihinet ID.');
    }
    query.under = req.query.under;
  }

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || 'name';

  const atbiyas = await Atbiya.find(query)
    .populate('under')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Atbiya.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      atbiyas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Atbiya records retrieved successfully.',
  });
});

// @desc    Get Atbiya records by WeredaBetekihinet ID
// @route   GET /api/atbiyas/wereda/:weredaId
// @access  Private (admin and wereda_admin)
const getAtbiyasByWeredaId = asyncHandler(async (req, res) => {
  const { weredaId } = req.params;

  if (!weredaId.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400);
    throw new Error('Invalid WeredaBetekihinet ID format.');
  }

  if (req.user.role === 'wereda_admin' && req.user.weredaId.toString() !== weredaId) {
    res.status(403);
    throw new Error('Unauthorized to access Atbiyas from another Wereda.');
  }

  const wereda = await WeredaBetekihinet.findById(weredaId);
  if (!wereda) {
    res.status(404);
    throw new Error('Wereda not found.');
  }

  const atbiyas = await Atbiya.find({ under: weredaId }).populate('under');

  res.status(200).json({
    success: true,
    data: atbiyas,
    message: 'Atbiyas retrieved successfully by Wereda ID.',
  });
});

module.exports = {
  createAtbiya,
  updateAtbiya,
  getAtbiyas,
  getAtbiyasByWeredaId
};
