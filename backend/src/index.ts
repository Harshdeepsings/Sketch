import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import UserRoutes from "./Routes/UserRoutes";
import CanvasRoutes from "./Routes/CanvasRoutes";

const app = express();
app.use(cookieParser());

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("MongoDB connected");

        app.listen(process.env.PORT);

    }catch(err){
        console.log("MongoDB connection failed");
        console.log(err);
    }
}

app.use("api/v1/user", UserRoutes);
app.use("api/v1/canvas", CanvasRoutes);

connectDB();