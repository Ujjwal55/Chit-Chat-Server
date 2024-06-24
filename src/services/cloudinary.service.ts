import * as dotenv from "dotenv"
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"

dotenv.config()

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (file: any) => {
    try {
        if(!file) return null;
        const cloudinaryResponse = await cloudinary.uploader.upload(file, {
            resource_type: "auto"
        })
        console.log("File uploaded successfully on cloudinary!", cloudinaryResponse.url);
        return cloudinaryResponse;
    } catch (error){
        console.log("errorrrrrrrrrrrr", error);
        fs.unlinkSync(file)
        return null;
    }
}

const uploadMultipleFilesOnCloudinary = async (files: any[]) => {
    const uploadPromises = files.map(file => uploadOnCloudinary(file.path));
    return Promise.all(uploadPromises);
}

export {uploadOnCloudinary, uploadMultipleFilesOnCloudinary};