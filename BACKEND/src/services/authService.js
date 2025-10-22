import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import { ROLES } from '../lib/constants.js';
import logger from '../lib/logger.js';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(userId, orgId, role) {
  return jwt.sign(
    { userId, orgId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export async function registerUser(email, password, name) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const error = new Error('User already exists');
      error.statusCode = 409;
      throw error;
    }

    // Create organization
    const org = new Organization({
      name: `${name}'s Workspace`,
    });
    await org.save();

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      hashedPassword,
      name,
      orgId: org._id,
      role: ROLES.OWNER,
    });
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, org._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`User registered: ${user._id}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        orgId: org._id,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+hashedPassword');

    if (!user || !(await comparePasswords(password, user.hashedPassword))) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('User account is inactive');
      error.statusCode = 403;
      throw error;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.orgId, user.role);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`User logged in: ${user._id}`);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
}

export async function refreshAccessToken(refreshToken) {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      const error = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    const accessToken = generateAccessToken(user._id, user.orgId, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    logger.info(`Token refreshed for user: ${user._id}`);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    const err = new Error('Invalid refresh token');
    err.statusCode = 401;
    throw err;
  }
}