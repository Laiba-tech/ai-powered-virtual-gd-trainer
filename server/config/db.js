
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURL = process.env.MONGO_URL;

    if (!mongoURL) {
      throw new Error("MONGO_URL is missing from the .env file");
    }

    await mongoose.connect(mongoURL);

    console.log("MongoDB connected successfully ✅");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    throw error;
  }
};

module.exports = connectDB;
