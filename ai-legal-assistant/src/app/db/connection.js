import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // If already connected, check if the connection is alive
        if (mongoose.connection.readyState === 1) {
            try {
                await mongoose.connection.db.admin().ping();
                console.log("Already connected to MongoDB and connection is alive.");
                return {
                    status: 200,
                    msg: "Already Connected"
                };
            } catch (pingErr) {
                console.warn("Stale MongoDB connection detected. Reconnecting...");
                await mongoose.disconnect(); // Clear stale connection
            }
        }

        // Establish a new connection
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`\nMongoDB connected! DB Name: ${connectionInstance.connection.name}`);
        return {
            status: 200,
            msg: "Successfully Connected"
        };
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        return {
            status: 500,
            msg: "MongoDB connection failed",
            error: error.message
        };
    }
};

export { connectDB };
