import dotenv from "dotenv";
dotenv.config();
import express from "express"; 
import mongoose from "mongoose";

import UserRoutes from "./Routes/UserRoutes";
import CanvasRoutes from "./Routes/CanvasRoutes";
import { error } from "node:console";

const app = express();

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

app.get("canvas", (req, res) => {

});

app.post("canvas", (req, res) => {

});


connectDB();