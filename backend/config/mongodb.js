import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Set strictQuery to prepare for Mongoose 7
        mongoose.set('strictQuery', false);
        
        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'skillify',  // Specify database name here
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000, // Increased socket timeout
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Handle connection errors
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
            if (err.code === 'ECONNRESET') {
                console.log('Connection reset detected, attempting to reconnect...');
                setTimeout(() => {
                    mongoose.connect(process.env.MONGODB_URI).catch(err => {
                        console.error('Reconnection failed:', err);
                    });
                }, 5000); // Wait 5 seconds before reconnecting
            }
        });
        
        // Handle disconnections
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected, attempting to reconnect...');
            setTimeout(() => {
                mongoose.connect(process.env.MONGODB_URI).catch(err => {
                    console.error('Reconnection failed:', err);
                });
            }, 5000);
        });
        
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Log the connection string (without password for security)
        const sanitizedUri = process.env.MONGODB_URI.replace(
            /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
            'mongodb+srv://$1:****@'
        );
        console.log(`Attempted to connect with: ${sanitizedUri}`);
        process.exit(1);
    }
};

export default connectDB;