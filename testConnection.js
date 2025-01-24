const mongoose = require('mongoose');

const uri = 'mongodb+srv://hizalhaziq:9006@cluster0.oqp0oqe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('Failed to connect to MongoDB Atlas:', err));
