import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
  try {
    mongoose.connection.on("conncted", () => {
      console.log("connected to db sucessfully");
    });

    mongoose.connection.on("error", (err) => {
      console.log("error in connecting to databse", err);
    });

    await mongoose.connect(config.databaseUrl as string);
  } catch (err) {
    console.error("Failed to connect db", err);
    process.exit(1);
  }
};
export default connectDB;
