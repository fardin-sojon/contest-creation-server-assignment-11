require('dotenv').config();
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
});
const User = mongoose.model('User', userSchema);

mongoose.connect(process.env.DB_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        try {
            // Pick a user to test update on. Let's find "Creator" and try to make them "user"
            const user = await User.findOne({ email: 'creator@creator.com' });
            if (user) {
                console.log(`Found user: ${user.name} (${user.role})`);
                const result = await User.findByIdAndUpdate(user._id, { $set: { role: 'user' } }, { new: true });
                console.log('Update result:', result);

                // Revert back
                await User.findByIdAndUpdate(user._id, { $set: { role: 'creator' } });
                console.log('Reverted role back to creator');
            } else {
                console.log('User creator@creator.com not found');
            }
        } catch (err) {
            console.error("Error during update:", err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch((error) => {
        console.log('MongoDB Connection Failed', error);
    });
