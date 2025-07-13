import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';   //file system

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    cloud_api_key:process.env.CLOUDINARY_API_KEY,
    cloud_api_secret:process.env.CLOUDINARY_SECRET_KEY
})

const uploadOnCloudinary = async(localFilePath)=>{
   try {
     if (!localFilePath) return null;
     //uploading file on cloudinary
        const response=await cloudinary.uploader.upload(
        localFilePath,{
            resource_type:auto
        }
    )
    //file successfully uploaded on cloudinary
    console.log("file is uploaded on cloudinary",response.url);
    return response
   } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally save temporary file as the upload operation got fail
        return error
   }
}

export {uploadOnCloudinary} 