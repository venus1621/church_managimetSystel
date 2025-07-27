const asyncHandler = require('express-async-handler');
const Death = require('../models/Death');
const Believer = require('../models/Believer');
const Atbiya = require('../models/Atbiya');

// Helper: Validate Wereda access for believer
const isBelieverInWereda = async (believerId, weredaId) => {
  const believer = await Believer.findById(believerId).populate({
    path: 'atbiya',
    populate: { path: 'under' }
  });
  return believer?.atbiya?.under?._id?.toString() === weredaId.toString();
};

// CREATE
const createDeath = asyncHandler(async (req, res) => {
  const { believer, dateOfDeath, graveLocation } = req.body;

  if (!believer || !dateOfDeath) {
    res.status(400);
    throw new Error('Believer ID and date of death are required.');
  }

  const believerDoc = await Believer.findById(believer).populate({
    path: 'atbiya',
    populate: { path: 'under' }
  });
  if (!believerDoc) {
    res.status(400);
    throw new Error('Invalid believer ID.');
  }

  if (
    req.user.role === 'wereda_admin' &&
    believerDoc.atbiya?.under?._id.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to create this death record.');
  }

  if (graveLocation) {
    const location = await Atbiya.findById(graveLocation);
    if (!location) {
      res.status(400);
      throw new Error('Invalid grave location ID.');
    }
  }

  const existingDeath = await Death.findOne({ believer });
  if (existingDeath) {
    res.status(400);
    throw new Error('Death record already exists for this believer.');
  }

  const death = await Death.create({ believer, dateOfDeath, graveLocation });
  await death.populate('believer graveLocation');

  res.status(201).json({
    success: true,
    data: death,
    message: 'Death record created successfully.',
  });
});

// UPDATE
const updateDeath = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dateOfDeath, graveLocation } = req.body;

  const death = await Death.findById(id).populate({
    path: 'believer',
    populate: { path: 'atbiya', populate: { path: 'under' } }
  });
  if (!death) {
    res.status(404);
    throw new Error('Death record not found.');
  }

  if (
    req.user.role === 'wereda_admin' &&
    death.believer?.atbiya?.under?._id.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to update this record.');
  }

  if (graveLocation) {
    const location = await Atbiya.findById(graveLocation);
    if (!location) {
      res.status(400);
      throw new Error('Invalid grave location ID.');
    }
    death.graveLocation = graveLocation;
  }

  if (dateOfDeath) death.dateOfDeath = dateOfDeath;

  const updatedDeath = await death.save();
  await updatedDeath.populate('believer graveLocation');

  res.status(200).json({
    success: true,
    data: updatedDeath,
    message: 'Death record updated successfully.',
  });
});

// GET ALL
const getDeaths = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'wereda_admin') {
    const believers = await Believer.find({}).populate({
      path: 'atbiya',
      populate: { path: 'under' }
    });

    const filteredIds = believers
      .filter(b => b.atbiya?.under?._id.toString() === req.user.weredaId.toString())
      .map(b => b._id.toString());

    query.believer = { $in: filteredIds };
  }

  if (req.query.believer) {
    const believer = await Believer.findById(req.query.believer);
    if (!believer) {
      res.status(400);
      throw new Error('Invalid believer ID.');
    }
    query.believer = req.query.believer;
  }

  if (req.query.graveLocation) {
    const location = await Atbiya.findById(req.query.graveLocation);
    if (!location) {
      res.status(400);
      throw new Error('Invalid grave location ID.');
    }
    query.graveLocation = req.query.graveLocation;
  }

  if (req.query.startDate || req.query.endDate) {
    query.dateOfDeath = {};
    if (req.query.startDate) query.dateOfDeath.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.dateOfDeath.$lte = new Date(req.query.endDate);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-dateOfDeath';

  const deaths = await Death.find(query)
    .populate('believer graveLocation')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Death.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      deaths,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Death records retrieved successfully.',
  });
});

// GET ONE
const getDeath = asyncHandler(async (req, res) => {
  const death = await Death.findById(req.params.id)
    .populate({
      path: 'believer',
      populate: { path: 'atbiya', populate: { path: 'under' } }
    })
    .populate('graveLocation');

  if (!death) {
    res.status(404);
    throw new Error('Death record not found');
  }

  if (
    req.user.role === 'wereda_admin' &&
    death.believer?.atbiya?.under?._id.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to access this record.');
  }

  res.status(200).json({
    success: true,
    data: death,
    message: 'Death record retrieved successfully.'
  });
});

// DELETE
const deleteDeath = asyncHandler(async (req, res) => {
  const death = await Death.findById(req.params.id).populate({
    path: 'believer',
    populate: { path: 'atbiya', populate: { path: 'under' } }
  });

  if (!death) {
    res.status(404);
    throw new Error('Death record not found');
  }

  if (
    req.user.role === 'wereda_admin' &&
    death.believer?.atbiya?.under?._id.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('You are not authorized to delete this record.');
  }

  await Believer.findByIdAndUpdate(death.believer._id, { liveStatus: 'Active' });
  await death.remove();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Death record deleted successfully.'
  });
});

module.exports = {
  createDeath,
  updateDeath,
  getDeaths,
  getDeath,
  deleteDeath
};
