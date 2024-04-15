import mongoose from "mongoose";

const connectToDatabase = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log("MongoDB connected!", connectionInstance.connection.name);
    } catch(error){
        console.log("Error connecting to MongoDB", error);
        process.exit(1);
    }
}

export default connectToDatabase;