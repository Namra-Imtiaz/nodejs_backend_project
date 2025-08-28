import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerController=asyncHandler(async (req,res)=>{  //aik jo wrapper banaya tha utility mai wo use kar rahai yaha pai yahi sai dekh lo bohot jagah kaam anai wala hai
    //we will get data from the frontend
    const {username,email,fullName,password}=req.body;

    //apply validation checks the fields should not be empty
    if(email===""){
        throw new ApiError(400,"Please fill all fields");
    }
    if(username===""){
        throw new ApiError(400,"Please fill all fields");
    }
    if(fullName===""){
        throw new ApiError(400,"Please fill all fields");
    }
    if(password===""){
        throw new ApiError(400,"Please fill all fields");
    }

    //check if user already exist through username or email
    const existedEmail = await User.findOne({ email });  // object ke andar pass karo
    if (existedEmail) {
    throw new ApiError(400, 'This email already exists');
    }

    const existedUsername = await User.findOne({ username });
    if (existedUsername) {
    throw new ApiError(400, 'This username already exists');
    }

    //console.log(req.files);
    //upload files on server
    const localPathAvatar = req.files?.avatar[0]?.path;
    // const localPathCoverImage = req.files?.coverImage[0]?.path;
    let localPathCoverImage;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        localPathCoverImage = req.files?.coverImage[0]?.path;
    }
    if(!localPathAvatar){
        throw new ApiError(400,'upload your avatar')
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(localPathAvatar);
    //console.log("Uploaded Avatar:", avatar);
    const coverImage = await uploadOnCloudinary(localPathCoverImage)

    //create entry in db
    const user = await User.create({
    email,
    username: username.toLowerCase(),
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    });

    //remove password and refreshToken from response ku kai response hamai frontend per bhi bhejna hoga 
    const createdUser = await User.findById(user._id).select("-password -refreshToken"); 

    //check the user 
    if(!createdUser){
        throw new ApiError(500,"something went wrong while registering the user")
    }

    //send res
    res.status(201).json(
    new ApiResponse(201, createdUser, "user created successfully")
    );
}
)

const loginController = asyncHandler(async(req,res)=>{
    //req body -> data  *
    //username or email 
    //find the user
    //password check 
    //generate access and refresh token (we need to apply this many times,we will make a method for this so that whenever u need them u can call it)
    //send cookie

    //req body -> data 
    const {username , email , password} = req.body

    //username or email
    if(!username || !email){
        throw new ApiError(400,"Please provide all credentials")
    }
    
    //find the user
    const user = await User.findOne({
        $or:[{username},{email}]  //ya to email dhoodh do ya username 
    })

    if(!user){
        new ApiError(400,"user doesnot exist")
    }

    //password check 
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"invalid credentials")
    }

})
export default registerController;