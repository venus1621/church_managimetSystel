const asyncHandler = require('express-async-handler');
const Believer = require('../models/Believer');
const Atbiya = require('../models/Atbiya');

// Utility to get Atbiya IDs for a Wereda
const getAtbiyaIdsForWereda = async (weredaId) => {
  const atbiyas = await Atbiya.find({ under: weredaId }).select('_id');
  return atbiyas.map((a) => a._id);
};

// Create a new Believer
const createBeliever = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const {
    firstName,
    fatherName,
    grandfatherName,
    gender,
    dateOfBirth,
    christianityName,
    educationLevel,
    role,
    liveStatus,
    phone,
    emergencyPhone,
    atbiya,
    motherName,
    motherFatherName,
    soulFatherName,
    photoUrl,
  } = req.body;

  if (!firstName || !gender || !dateOfBirth || !role) {
    res.status(400);
    throw new Error('First name, gender, date of birth, and role are required.');
  }

  if (atbiya) {
    const church = await Atbiya.findById(atbiya);
    if (!church) {
      res.status(400);
      throw new Error('Invalid atbiya ID.');
    }
  }

  if (phone) {
    const existingBeliever = await Believer.findOne({ phone });
    if (existingBeliever) {
      res.status(400);
      throw new Error('Phone number already in use.');
    }
  }

  const believer = await Believer.create({
    firstName,
    fatherName,
    grandfatherName,
    gender,
    dateOfBirth,
    christianityName,
    educationLevel,
    role,
    liveStatus: liveStatus || 'Active',
    phone,
    emergencyPhone,
    atbiya,
    motherName,
    motherFatherName,
    soulFatherName,
    photoUrl,
  });

  await believer.populate('atbiya');

  res.status(201).json({
    success: true,
    data: believer,
    message: 'Believer created successfully.',
  });
});

// Update Believer
const updateBeliever = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const { id } = req.params;
  const updateData = req.body;

  const believer = await Believer.findById(id);
  if (!believer) {
    res.status(404);
    throw new Error('Believer not found.');
  }

  if (updateData.atbiya) {
    const church = await Atbiya.findById(updateData.atbiya);
    if (!church) {
      res.status(400);
      throw new Error('Invalid atbiya ID.');
    }
  }

  if (updateData.phone && updateData.phone !== believer.phone) {
    const existingBeliever = await Believer.findOne({ phone: updateData.phone });
    if (existingBeliever) {
      res.status(400);
      throw new Error('Phone number already in use.');
    }
  }

  Object.assign(believer, updateData);
  const updated = await believer.save();
  await updated.populate('atbiya death');

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Believer updated successfully.',
  });
});

// Get all Believers
const getBelievers = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'wereda_admin') {
    const atbiyaIds = await getAtbiyaIdsForWereda(req.user.weredaId);
    query.atbiya = { $in: atbiyaIds };
  }

  if (req.query.role) query.role = req.query.role;
  if (req.query.liveStatus) query.liveStatus = req.query.liveStatus;
  if (req.query.gender) query.gender = req.query.gender;

  if (req.query.atbiya) {
    const church = await Atbiya.findById(req.query.atbiya);
    if (!church) {
      res.status(400);
      throw new Error('Invalid atbiya ID.');
    }
    query.atbiya = req.query.atbiya;
  }

  if (req.query.minAge || req.query.maxAge) {
    const today = new Date();
    query.dateOfBirth = {};
    if (req.query.minAge) {
      query.dateOfBirth.$lte = new Date(today.getFullYear() - parseInt(req.query.minAge), today.getMonth(), today.getDate());
    }
    if (req.query.maxAge) {
      query.dateOfBirth.$gte = new Date(today.getFullYear() - parseInt(req.query.maxAge) - 1, today.getMonth(), today.getDate());
    }
  }

  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || 'firstName';

  const believers = await Believer.find(query)
    .populate('atbiya', 'name address')
    .populate('death', 'dateOfDeath')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Believer.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      believers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Believers retrieved successfully.',
  });
});

// Get one Believer
const getBeliever = asyncHandler(async (req, res) => {
  const believer = await Believer.findById(req.params.id)
    .populate('atbiya', 'name')
    .populate('baptism', 'baptismDate')
    .populate('marriage', 'marriageDate')
    .populate('death', 'dateOfDeath');

  if (!believer) {
    res.status(404);
    throw new Error('Believer not found');
  }

  res.status(200).json({
    success: true,
    data: believer,
    message: 'Believer retrieved successfully.'
  });
});

// Delete Believer
const deleteBeliever = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized. Admin access required.');
  }

  const believer = await Believer.findById(req.params.id);
  if (!believer) {
    res.status(404);
    throw new Error('Believer not found');
  }

  await believer.remove();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Believer deleted successfully.'
  });
});

// Get Believer Stats
const getBelieverStatistics = asyncHandler(async (req, res) => {
  const stats = await Believer.aggregate([
    {
      $group: {
        _id: '$gender',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byGender: {
          $push: {
            gender: '$_id',
            count: '$count'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byGender: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: stats[0] || { total: 0, byGender: [] },
    message: 'Statistics retrieved successfully.'
  });
});

module.exports = {
  createBeliever,
  updateBeliever,
  getBelievers,
  getBeliever,
  deleteBeliever,
  getBelieverStatistics
};
