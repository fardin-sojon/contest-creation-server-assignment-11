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

// --- AUTH ---
app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || 'secret', { expiresIn: '1h' });
    res.send({ token });
});

app.post('/users', async (req, res) => {
    try {
        const user = req.body;
        if (!user.email) return res.status(400).send({ message: 'Email is required' });
        const isExist = await User.findOne({ email: user.email });
        if (isExist) {
           
            await User.updateOne(
                { email: user.email },
                { $set: { name: user.name, image: user.image } }
            );
            return res.send({ message: 'User already exists', insertedId: null });
        }
        const newUser = new User(user);
        const result = await newUser.save();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


// --- USERS ---
app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    const result = await User.find();
    res.send(result);
});

app.get('/users/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    const result = await User.findOne({ email });
    res.send(result);
});



app.patch('/users/role/:id', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const { role } = req.body;
    const result = await User.findByIdAndUpdate(id, { $set: { role: role } }, { new: true });
    res.send(result);
});

app.put('/users/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    const body = req.body;
    const result = await User.updateOne({ email: email }, { $set: { ...body } });
    res.send(result);
});


app.get('/leaderboard', async (req, res) => {
    const result = await Contest.aggregate([
        { $match: { winner: { $ne: null } } },
        { $group: { _id: "$winner", winCount: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 1, winCount: 1, name: "$user.name", image: "$user.image" } },
        { $sort: { winCount: -1 } }
    ]);
    res.send(result);
});

// --- CONTESTS ---
app.get('/contests', async (req, res) => {
    const { search, type, page = 1, limit = 10 } = req.query;
    let query = { status: 'approved' };
    if (search) query.type = { $regex: search, $options: 'i' };
    if (type) query.type = type;

    const count = await Contest.countDocuments(query);
    const result = await Contest.find(query, 'name image description participationCount type status')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    res.send({ result, count });
});


app.get('/contests/popular', async (req, res) => {
    const result = await Contest.find({ status: 'approved' })
        .sort({ participationCount: -1 })
        .limit(6);
    res.send(result);
});

app.get('/contests/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const result = await Contest.findById(id).populate('winner', 'name image');
        if (!result) return res.status(404).send({ message: "Contest not found" });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

app.post('/contests', verifyToken, verifyCreator, async (req, res) => {
    const contest = req.body;
    const newContest = new Contest(contest);
    const result = await newContest.save();
    res.send(result);
});

app.put('/contests/:id', verifyToken, verifyCreator, async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;
    const result = await Contest.findByIdAndUpdate(id, updatedData, { new: true });
    res.send(result);
});


app.get('/contests/creator/:email', verifyToken, verifyCreator, async (req, res) => {
    const email = req.params.email;
    const result = await Contest.find({ 'creator.email': email });
    res.send(result);
});

app.delete('/contests/:id', verifyToken, verifyCreator, async (req, res) => {
    const id = req.params.id;
    const result = await Contest.findByIdAndDelete(id);
    res.send(result);
});

app.patch('/contests/winner/:id', verifyToken, verifyCreator, async (req, res) => {
    const id = req.params.id;
    const { winnerId } = req.body;
    const result = await Contest.updateOne({ _id: id }, { winner: winnerId });
    res.send(result);
});


// Admin Contest Routes
app.get('/admin/contests', verifyToken, verifyAdmin, async (req, res) => {
    const result = await Contest.find();
    res.send(result);
});

app.patch('/admin/contests/:id', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await Contest.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    res.send(result);
});

app.delete('/admin/contests/:id', verifyToken, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const result = await Contest.findByIdAndDelete(id);
    res.send(result);
});

app.get('/contests/won/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (!user) return res.send([]);
    const result = await Contest.find({ winner: user._id });
    res.send(result);
});

// PAYMENTS 
app.post('/create-checkout-session', verifyToken, async (req, res) => {
    const { contestId, contestName, amount, userEmail } = req.body;
    if (!contestId || !amount) return res.status(400).send({ error: "Missing required fields" });
    const priceInCents = parseInt(parseFloat(amount) * 100);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: contestName },
                    unit_amount: priceInCents,
                },
                quantity: 1,
            }],
            mode: 'payment',
            customer_email: userEmail,
            metadata: { contestId, userEmail, contestName },
            success_url: `http://localhost:5173/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/payment-fail`,
        });
        res.send({ url: session.url });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.post('/confirm-payment', verifyToken, async (req, res) => {
    const { session_id } = req.body;
    try {
        const session = await stripe.checkout.sessions.retrieve(session_id);
        if (session.payment_status === 'paid') {
            const { contestId, userEmail, contestName } = session.metadata;
            const existingPayment = await Payment.findOne({ transactionId: session.payment_intent });
            if (existingPayment) return res.send({ success: true, message: 'Already Processed' });

            const payment = await Payment.create({
                email: userEmail,
                price: session.amount_total / 100,
                transactionId: session.payment_intent,
                contestId,
                contestName,
                status: 'succeeded'
            });

            await Contest.updateOne({ _id: contestId }, { $inc: { participationCount: 1 } });
            res.send({ success: true, paymentResult: payment });
        } else {
            res.send({ success: false, message: 'Payment not paid' });
        }
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});


app.get('/', (req, res) => {
    res.send('ContestHub Server is running');
});

app.listen(port, () => {
    console.log(`ContestHub Server is running on port ${port}`);
});
