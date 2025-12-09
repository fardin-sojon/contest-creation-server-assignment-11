require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

// CONFIGURATION
const corsOptions = {
    origin: '*',
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// DB CONNECTION
mongoose.connect(process.env.DB_URI)
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch((error) => {
        console.log('MongoDB Connection Failed', error);
    });

// User Model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
    address: { type: String, default: '' },
    bio: { type: String, default: '' }
});
const User = mongoose.model('User', userSchema);

// Contest Model
const contestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    prize: { type: String, required: true },
    taskInstruction: { type: String, required: true },
    type: { type: String, required: true },
    tags: [{ type: String }],
    deadline: { type: Date, required: true },
    creator: {
        name: String,
        email: String,
        image: String
    },
    status: { type: String, default: 'pending' },
    participationCount: { type: Number, default: 0 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});
const Contest = mongoose.model('Contest', contestSchema);

// Payment Model
const paymentSchema = new mongoose.Schema({
    email: { type: String, required: true },
    price: { type: Number, required: true },
    transactionId: { type: String, required: true },
    date: { type: Date, default: Date.now },
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
    contestName: { type: String },
    status: { type: String, default: 'pending' }
});
const Payment = mongoose.model('Payment', paymentSchema);

// Submission Model
const submissionSchema = new mongoose.Schema({
    contestId: { type: String, required: true },
    userId: { type: String, required: true },
    participantEmail: { type: String, required: true },
    participantName: { type: String, required: true },
    taskUrl: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Submission = mongoose.model('Submission', submissionSchema);

// MIDDLEWARES

const verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
    })
};

const verifyAdmin = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await User.findOne(query);
    const isAdmin = user?.role === 'admin';
    if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
};



const verifyCreator = async (req, res, next) => {
    const email = req.decoded.email;
    const query = { email: email };
    const user = await User.findOne(query);
    const isCreator = user?.role === 'creator';
    if (!isCreator) {
        return res.status(403).send({ message: 'forbidden access' });
    }
    next();
};



app.get('/', (req, res) => {
    res.send('ContestHub Server is running');
});

app.listen(port, () => {
    console.log(`ContestHub Server is running on port ${port}`);
});
