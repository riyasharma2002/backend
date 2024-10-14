require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static route for image access

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define the user schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    socialMediaHandle: { type: String, required: true },
    images: [String]  // Array to store image paths
});

const User = mongoose.model('User', userSchema);

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Path where images will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Create unique filenames
    }
});

const upload = multer({ storage });

// Endpoint to handle form submission (POST /submit)
app.post('/submit', upload.array('images', 10), async (req, res) => {
    const { name, socialMediaHandle } = req.body;
    const imagePaths = req.files.map(file => file.path); // Store paths of uploaded images

    if (!name || !socialMediaHandle || imagePaths.length === 0) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newUser = new User({
        name,
        socialMediaHandle,
        images: imagePaths
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'Submission successful' });
    } catch (err) {
        res.status(500).json({ error: 'Submission failed' });
    }
});

// Endpoint to retrieve submissions for the admin dashboard (GET /submissions)
app.get('/submissions', async (req, res) => {
    try {
        const submissions = await User.find(); // Retrieve all user submissions
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});


app.use(express.static(path.join(__dirname, 'frontend/build')));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
