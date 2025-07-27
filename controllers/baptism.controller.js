const asyncHandler = require('express-async-handler');
const Baptism = require('../models/Baptism');
const Believer = require('../models/Believer');
const Atbiya = require('../models/Atbiya');

// Utility: Get list of Atbiya IDs for a Wereda
const getAtbiyaIdsForWereda = async (weredaId) => {
  const atbiyas = await Atbiya.find({ under: weredaId }).select('_id');
  return atbiyas.map(a => a._id.toString());
};

// ✅ Create Baptism
const createBaptism = asyncHandler(async (req, res) => {
  const { believer, baptismDate, baptismChurch, baptizedBy, christinaityparent } = req.body;

  if (!believer || !baptismDate || !baptismChurch || !christinaityparent?.name) {
    res.status(400);
    throw new Error('Believer, baptism date, baptism church, and Christianity parent name are required.');
  }

  const believerDoc = await Believer.findById(believer);
  if (!believerDoc) throw new Error('Invalid believer ID.');

  const church = await Atbiya.findById(baptismChurch);
  if (!church) throw new Error('Invalid Atbiya ID.');

  if (
    req.user.role === 'wereda_admin' &&
    church.under.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('Unauthorized to create baptism in this church.');
  }

  if (baptizedBy) {
    const baptizedByDoc = await Believer.findById(baptizedBy);
    if (!baptizedByDoc) throw new Error('Invalid baptized by ID.');
  }

  if (christinaityparent?.phone && !/^\+?\d{10,15}$/.test(christinaityparent.phone)) {
    res.status(400);
    throw new Error('Invalid Christianity parent phone number format.');
  }

  const existingBaptism = await Baptism.findOne({ believer });
  if (existingBaptism) throw new Error('Baptism record already exists for this believer.');

  const baptism = await Baptism.create({
    believer,
    baptismDate,
    baptismChurch,
    baptizedBy,
    christinaityparent,
  });

  await baptism.populate('believer baptismChurch baptizedBy');

  res.status(201).json({
    success: true,
    data: baptism,
    message: 'Baptism record created successfully.',
  });
});

// ✅ Update Baptism
const updateBaptism = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const baptism = await Baptism.findById(id).populate('baptismChurch');
  if (!baptism) throw new Error('Baptism record not found.');

  if (
    req.user.role === 'wereda_admin' &&
    baptism.baptismChurch?.under?.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('Unauthorized to update this record.');
  }

  if (updateData.baptismChurch) {
    const church = await Atbiya.findById(updateData.baptismChurch);
    if (!church) throw new Error('Invalid Atbiya ID.');
    if (
      req.user.role === 'wereda_admin' &&
      church.under.toString() !== req.user.weredaId.toString()
    ) {
      res.status(403);
      throw new Error('Unauthorized to reassign baptismChurch.');
    }
  }

  if (updateData.baptizedBy) {
    const baptizedByDoc = await Believer.findById(updateData.baptizedBy);
    if (!baptizedByDoc) throw new Error('Invalid baptized by ID.');
  }

  if (updateData.christinaityparent?.phone && !/^\+?\d{10,15}$/.test(updateData.christinaityparent.phone)) {
    throw new Error('Invalid Christianity parent phone number format.');
  }

  Object.assign(baptism, updateData);
  const updated = await baptism.save();
  await updated.populate('believer baptismChurch baptizedBy');

  res.status(200).json({
    success: true,
    data: updated,
    message: 'Baptism record updated successfully.',
  });
});

// ✅ Get All Baptisms
const getBaptisms = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === 'wereda_admin') {
    const atbiyaIds = await getAtbiyaIdsForWereda(req.user.weredaId);
    query.baptismChurch = { $in: atbiyaIds };
  }

  if (req.query.believer) {
    const believer = await Believer.findById(req.query.believer);
    if (!believer) throw new Error('Invalid believer ID.');
    query.believer = req.query.believer;
  }

  if (req.query.baptismChurch) {
    const church = await Atbiya.findById(req.query.baptismChurch);
    if (!church) throw new Error('Invalid Atbiya ID.');
    query.baptismChurch = req.query.baptismChurch;
  }

  if (req.query.baptizedBy) {
    const baptizedByDoc = await Believer.findById(req.query.baptizedBy);
    if (!baptizedByDoc) throw new Error('Invalid baptized by ID.');
    query.baptizedBy = req.query.baptizedBy;
  }

  if (req.query.startDate || req.query.endDate) {
    query.baptismDate = {};
    if (req.query.startDate) query.baptismDate.$gte = new Date(req.query.startDate);
    if (req.query.endDate) query.baptismDate.$lte = new Date(req.query.endDate);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = req.query.sort || '-baptismDate';

  const baptisms = await Baptism.find(query)
    .populate('believer', 'firstName gender')
    .populate('baptismChurch', 'name address.region')
    .populate('baptizedBy', 'firstName')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Baptism.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      baptisms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    message: 'Baptism records retrieved successfully.',
  });
});

// ✅ Get Single Baptism Record
const getBaptismById = asyncHandler(async (req, res) => {
  const baptism = await Baptism.findById(req.params.id)
    .populate({
      path: 'baptismChurch',
      populate: { path: 'under' }
    })
    .populate('believer')
    .populate('baptizedBy');

  if (!baptism) {
    res.status(404);
    throw new Error('Baptism record not found.');
  }

  if (
    req.user.role === 'wereda_admin' &&
    baptism.baptismChurch?.under?._id.toString() !== req.user.weredaId.toString()
  ) {
    res.status(403);
    throw new Error('Unauthorized to access this record.');
  }

  res.status(200).json({
    success: true,
    data: baptism,
    message: 'Baptism record retrieved successfully.',
  });
});

module.exports = {
  createBaptism,
  updateBaptism,
  getBaptisms,
  getBaptismById
};
