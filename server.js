require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();


app.use(cors({
    origin: 'https://gleaming-figolla-48f2ae.netlify.app',  // Use your actual Netlify frontend URL
    methods: ['GET', 'POST']
}));

app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static route for image access


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    socialMediaHandle: { type: String, required: true },
    images: [String]  // Array to store image paths
});

const User = mongoose.model('User', userSchema);


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Path where images will be stored
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Create unique filenames
    }
});

const upload = multer({ storage });


app.post('/api/submit', upload.array('images', 10), async (req, res) => {
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


app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await User.find(); // Retrieve all user submissions
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});
app.get('/',(req,res)=>{
    res.send({
        activeStatus : true,
        error:false,
    })
})

// Define the port and start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
