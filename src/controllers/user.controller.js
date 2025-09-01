import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

const generteAccessAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findOne(userId);  //user ka document object dhondho by id
        const accessToken = user.generateAccessToken(); //access token generate kro
        const refreshToken = user.generateRefreshToken(); //refresh token generate kro
        user.refreshToken = refreshToken; //eerated refresh token ko user document mai dalo
        await user.save({ validateBeforeSave: false }); //usko db mai save kro ({ validateBeforeSave: false } so that it dont kick password to the db)
        return {accessToken,refreshToken}; //access aur refresh ko return kro
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token");
    }
}

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
    const {username , email , password} = req.body;

    //username or email
    if(!(username || email)){
        throw new ApiError(400,"Please provide all credentials");
    }
    
    //find the user
    const user = await User.findOne({
        $or:[{username},{email}]  //ya to email dhoodh do ya username 
    })

    if(!user){
        new ApiError(400,"user doesnot exist");
    }

    //password check 
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"invalid credentials");
    }

    //injecting tokens method that we made above in login
    const { accessToken,refreshToken } = await generteAccessAndRefreshTokens(user._id);

    //send cookies
    //is chotai walai user mai kuch unwanted fields bhi hain jasiay password and refresh token
    //laikin refresh token empty hoga ju kai generate to bad mai kia hai to tumhare pas us user ka refrence hai jis ka access token empty hai
    //ap chaho to usko object sai update kardo warna aik aur db query mar do
    //ab yaha ap ko decide karna hai db ko do baar call karna expensive operation hai, agar nahi hai to karlain warna object wala karlain
    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken"); ;

    //cookies jab bhi ap bhejtai ho to kuch options design kartai ho,nothing just object hota hai
    const options = {  //by default sab kai pas access hota hai cookies ka but options set karnai sai only server can change cookies
        httpOnly: true,
        secure: true
    }
    // 1. Authentication ke liye Cookies kyu?

    // Jab user login karta hai, server usko ek token deta hai (jaise JWT).

    // Ab problem ye hai → ye token frontend ko kahan store karna hai?

    // Do options hote hain:

    // localStorage / sessionStorage


    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
        user: loggedInUser, // ab chalega ✅
        accessToken,
        refreshToken            },
            "User logged in successfully"
        )
    )


})

const logoutController=asyncHandler(async(req,res)=>{
    //logout kai liyai cookies clear karni hon gi
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true  //undefined wala object chahiye ab without refreshtoken old walai mai to refreshtoken hai new walai mai nahi hoga 
        }
    )

    const options = {  //by default sab kai pas access hota hai cookies ka but options set karnai sai only server can change cookies
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"user logged out successfully")
    )
})

const refreshTokenController = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,'Unauthorized Request')
    }
    const dbRefreshToken = jwt.refreshToken
})


export {
    registerController,
    loginController,
    logoutController
};