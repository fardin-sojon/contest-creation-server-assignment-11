require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    image: String,
    role: String
});
const User = mongoose.model('User', userSchema);

const contestSchema = new mongoose.Schema({
    name: String,
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Contest = mongoose.model('Contest', contestSchema);

const checkWinner = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);

       
        const leaderboard = await Contest.aggregate([
            { $match: { winner: { $ne: null } } },
            { $group: { _id: "$winner", winCount: { $sum: 1 } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { _id: 1, winCount: 1, name: "$user.name", email: "$user.email", image: "$user.image" } },
            { $sort: { winCount: -1 } }
        ]);

        console.log("Leaderboard Data in DB:");
        console.log(JSON.stringify(leaderboard, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

checkWinner();
