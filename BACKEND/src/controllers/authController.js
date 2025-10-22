import { registerUser, loginUser, refreshAccessToken } from '../services/authService.js';
import logger from '../lib/logger.js';

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.validated;

    const result = await registerUser(email, password, name);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated;

    const result = await loginUser(email, password);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: 'Logged in successfully',
      user: result.user,
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    // Get refresh token from cookie or body
    const token = req.cookies?.refreshToken || req.body.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const result = await refreshAccessToken(token);

    // Set new refresh token in cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Token refreshed',
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export function logout(req, res) {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
}

export function getCurrentUser(req, res) {
  res.status(200).json({
    user: req.user,
  });
}