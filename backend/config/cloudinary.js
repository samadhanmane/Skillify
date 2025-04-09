import {v2 as cloudinary} from 'cloudinary'

const connectCloudinary = async () => {
    try {
        // Configure cloudinary
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_SECRET_KEY,
            secure: true
        });
        
        // Test the connection - this will throw an error if credentials are invalid
        const result = await cloudinary.api.ping();
        
        if (result && result.status === 'ok') {
            console.log('Cloudinary Connected Successfully');
        } else {
            console.warn('Cloudinary connected but status not confirmed');
        }
    } catch (error) {
        // Log error but don't stop the application
        console.error(`Cloudinary Configuration Error: ${error.message}`);
        console.warn('Application will continue, but image uploads may not work');
    }
}

export default connectCloudinary