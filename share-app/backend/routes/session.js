import express from 'express';
import crypto from 'crypto';
import Session from '../models/Session.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate a random 12-digit code
const generateCode = () => {
  return Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
};

// @route   POST /api/session/create
// @desc    Create a new connection session
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    let code;
    let isUnique = false;
    
    // Ensure the generated code is unique
    while (!isUnique) {
      code = generateCode();
      const existingSession = await Session.findOne({ code });
      if (!existingSession) isUnique = true;
    }

    const session = await Session.create({
      code,
      users: [req.user._id]
    });

    res.status(201).json({
      code: session.code,
      expiresAt: session.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/session/join
// @desc    Join an existing session
// @access  Private
router.post('/join', protect, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Session code is required' });
    }

    const session = await Session.findOne({ code });

    if (!session) {
      return res.status(404).json({ message: 'Session not found or expired' });
    }

    // Add user to session if not already in it
    if (!session.users.includes(req.user._id)) {
      if (session.users.length >= 2) {
        // Assume P2P style: max 2 users per secure room, but we can allow more if needed
        // return res.status(400).json({ message: 'Session is full' });
      }
      session.users.push(req.user._id);
      await session.save();
    }

    res.status(200).json({
      code: session.code,
      users: session.users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
