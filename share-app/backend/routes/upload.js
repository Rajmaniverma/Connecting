import express from 'express';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.js';
import Message from '../models/Message.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

let gfs;
mongoose.connection.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Create storage engine
const storage = new GridFsStorage({
  url: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/share-app',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = Date.now() + '-' + file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: 'uploads'
      };
      resolve(fileInfo);
    });
  }
});

const upload = multer({ storage });

// @route   POST /api/upload
// @desc    Upload file to DB
// @access  Private
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { sessionCode } = req.body;
    
    // Create a message entry to keep track of the file in the room
    const message = await Message.create({
      sessionCode,
      senderId: req.user._id,
      senderName: req.user.username,
      isFile: true,
      fileId: req.file.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });

    res.status(201).json({ file: req.file, message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/download/:id
// @desc    Download/Stream file from DB
// @access  Private (or public depending on share mechanism, here we'll keep it protected via auth)
router.get('/download/:id', protect, async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    
    const files = await gfs.find({ _id: fileId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No file exists' });
    }

    const file = files[0];
    
    // Set headers for download
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    
    const readStream = gfs.openDownloadStream(fileId);
    readStream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
