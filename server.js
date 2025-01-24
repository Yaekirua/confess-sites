const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

// Database setup
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://hizalhaziq:9006@cluster0.oqp0oqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Failed to connect to MongoDB:', error));

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
        next();
    } else {
        res.setHeader('WWW-Authenticate', 'Basic');
        return res.status(401).send('Invalid credentials.');
    }
});

// Routes
app.get('/', async (req, res) => {
    try {
        const letters = await Letter.find().sort({ timestamp: -1 });
        res.render('index', { letters: letters });
    } catch (error) {
        console.error('Error fetching letters:', error);
        res.status(500).send('Failed to load letters.');
    }
});

app.post('/submit', async (req, res) => {
    const letterContent = req.body.letter;
    try {
        const newLetter = new Letter({ content: letterContent });
        await newLetter.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error saving letter:', error);
        res.status(500).send('Failed to save the letter.');
    }
});

// Admin page route
app.get('/admin', async (req, res) => {
    try {
        const letters = await Letter.find().sort({ timestamp: -1 });
        res.render('admin', { letters: letters });
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('Failed to load admin page.');
    }
});

// Delete letter route
app.post('/delete/:id', async (req, res) => {
    const letterId = req.params.id;
    try {
        await Letter.findByIdAndDelete(letterId);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting letter:', error);
        res.status(500).send('Failed to delete the letter.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
