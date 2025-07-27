const User = require('../models/User');
const WeredaBetekihinet = require('../models/WeredaBetekihinet');
const logger = require('../utils/logger');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public or Private (optional restriction)
exports.register = async (req, res) => {
  try {
    const { username, password, role, WeredaBetekihinet: weredaId } = req.body;

    // Check for existing user
    let user = await User.findOne({ $or: [ { username }] });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Validate weredaId if role is wereda_admin
    if (role === 'wereda_admin') {
      const weredaExists = await WeredaBetekihinet.findById(weredaId);
      if (!weredaExists) {
        return res.status(400).json({ success: false, message: 'Invalid WeredaBetekihinet ID' });
      }
    }

    // Create user
    user = new User({
      username,
      
      password,
      role: role || 'secretary',
      WeredaBetekihinet: role === 'wereda_admin' ? weredaId : undefined
    });

    await user.save();

    // Generate token
    const token = user.generateAuthToken();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    logger.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

   user.lastLogin = Date.now();
await user.save({ validateBeforeSave: false });


    const token = user.generateAuthToken();
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse,
      token
    });
  } catch (error) {
    logger.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('WeredaBetekihinet', 'name address');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get current user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
