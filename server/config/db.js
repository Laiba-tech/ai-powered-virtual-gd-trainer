
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let memoryServer;

const connectDB = async () => {
  try {
    const mongoURL =
      process.env.MONGO_URL ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI;

    if (mongoURL) {
      await mongoose.connect(mongoURL);
      console.log("MongoDB connected successfully ✅");
      return;
    }

    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }

    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);

    console.log("MongoDB connected successfully ✅ using in-memory MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed ❌", error.message);
    throw error;
  }
};

module.exports = connectDB;
