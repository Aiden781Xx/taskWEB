const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Load model AFTER connection
    const User = require('./src/models/User');

    const email = process.env.ADMIN_EMAIL || 'admin@ethara.ai';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.ADMIN_NAME || 'Admin';

    const existing = await User.findOne({ email }).select('+password');

    if (existing) {
      // Directly update to avoid double-hashing via pre-save hooks
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(existing._id, {
        role: 'admin',
        password: hashedPassword,
        name,
      });
      console.log(`✅ Admin updated: ${email}`);
    } else {
      // Create fresh — pre-save hook will hash password
      await User.create({ name, email, password, role: 'admin' });
      console.log(`✅ Admin created: ${email}`);
    }

    console.log('\n🔐 Admin Credentials:');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\nYou can change these in server/.env\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeder failed:', err.message);
    process.exit(1);
  }
};

seedAdmin();
