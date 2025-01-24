require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials (use environment variables for security)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// Database setup
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://your-default-uri', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout for connection
    socketTimeoutMS: 45000,         // 45 seconds timeout for queries
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1); // Exit the process on failure
    });

// Define the schema and model
const letterSchema = new mongoose.Schema({
    content: String,
    timestamp: { type: Date, default: Date.now },
});
const Letter = mongoose.model('Letter', letterSchema);

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Authentication middleware for the admin page
app.use('/admin', (req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth) {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Authentication required.');
    }

    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    const [username, password] = credentials;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Invalid credentials.');
    }
});

// Routes
app.get('/', async (req, res) => {
    try {
        const letters = await Letter.find().sort({ timestamp: -1 });
        res.render('index', { letters });
    } catch (error) {
        console.error('Error fetching letters:', error.message);
        res.status(500).send('An error occurred while loading letters. Please try again later.');
    }
});

app.post('/submit', async (req, res) => {
    const letterContent = req.body.letter;
    if (!letterContent || letterContent.trim() === '') {
        return res.status(400).send('Letter content cannot be empty.');
    }

    try {
        const newLetter = new Letter({ content: letterContent });
        await newLetter.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error saving letter:', error.message);
        res.status(500).send('Failed to save the letter. Please try again later.');
    }
});

// Admin page route
app.get('/admin', async (req, res) => {
    try {
        const letters = await Letter.find().sort({ timestamp: -1 });
        res.render('admin', { letters });
    } catch (error) {
        console.error('Error loading admin page:', error.message);
        res.status(500).send('Failed to load admin page. Please try again later.');
    }
});

// Delete letter route
app.post('/delete/:id', async (req, res) => {
    const letterId = req.params.id;
    try {
        const deleted = await Letter.findByIdAndDelete(letterId);
        if (!deleted) {
            return res.status(404).send('Letter not found.');
        }
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting letter:', error.message);
        res.status(500).send('Failed to delete the letter. Please try again later.');
    }
});

// 404 Error Handling
app.use((req, res) => {
    res.status(404).send('Page not found.');
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unexpected error:', err.message);
    res.status(500).send('An unexpected error occurred. Please try again later.');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
