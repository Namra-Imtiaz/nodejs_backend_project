import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User, User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { pipeline } from "stream";

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

const refreshAccessTokenController = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401,'Unauthorized Request')
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,'Invalid refresh token')
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newrefreshToken}=await generteAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})

const changeCurrentPasswordController = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const passCorrect = user.isPasswordCorrect(oldPassword);
    if(!passCorrect){
        throw new ApiError(400,'User is unauthorized');
    }
    user.password = newPassword;
    await User.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},'Password changed Successfully'))
})

const getCurrentUserController = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,'Current User Fetched Successfully'))
})

const updateUserController = asyncHandler(async(req,res)=>{
    const {fullName , email} = req.body;

    if(!(fullName || email)){
        throw new ApiError(400 , "All Fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user._id,
        {$set:{
            fullName : fullName,
            email : email
        }},
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"User details updated successfully"))
})
//files update karnai kai liyai hamesha alag controller banao warna bar bbar text bhi update hota rahai ga
//iskai liyai 2 middleware lagtai hain aik multer and dosra user logged in hai bhi ya nhai iska khayal routing mai rakhna abhi controller likho

const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.avatar;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"error while uploading avatar on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}
    ).select("-password")

    res
    .status(200)
    .json(new ApiResponse(200,req.user,'user avatar updated successfully'))
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.coverImage;
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            coverImage:coverImage.url
        }},
        {new:true}
    ).select("-password")

     res
    .status(200)
    .json(new ApiResponse(200,req.user,'user cover image updated successfully'))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    //param sai username nikalo channel ka
    const {username} = req.params  //us channel ka name url sai nikalo 

    //check kro username hai bhi ya nahi 
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    //User.find({username})   aisay bhi username kai basis per document find karo to masla nahi hai phir id kai basis per aggragation lagao gai
    //yaha per alternatively match laga saktai hain wo sarai documents mai sai aik document khud he match kar lai ga
    const channel = User.aggregate([
            { 
                $match:{
                username:username?.toLowerCase()
                }
            },
            {   
                $lookup:{
                from:"subscriptions",  //model mai name sab lower case mai hojata and plural hojata
                localField:"_id",
                foreignField:"channel",  //is sai milai gai subscribers
                as:"subscribers"}
            },
            {   
                $lookup:{
                from:"subscriptions",  //model mai name sab lower case mai hojata and plural hojata
                localField:"_id",
                foreignField:"subscriber",  //is sai milai gai mainai kitno ko subscribe kia hua
                as:"subscribedTo"}
            },
            {
                $addFields:{
                    subscribersCount:{
                        size:"$subscribers"
                    }
                },
                    channelsSunscribedToCount:{
                        size:"$subscribedTo"
                    }
            },
            {
                isSubscribed:{  //yai subscribed wala button hai 
                    $cond:{
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},  //in ka matlab check karo present hai ya nahi 
                        //ab ismai idhar 'subscribers.subscriber' sai check karo yai 'req.user?._id' hai ya nahi
                        //in arrays mai bhi dekh laita hai aur objects mai bhi dekh laita hai
                        then:true,   //agar mil jae user to true mai dal do
                        else:false  //agar nahi milai to false mai dal do

                    }
                }
            },
            {
                $project:{  //ab jis jis cheez ke zarorat hai profile per wahi frontend ko do bas
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelsSunscribedToCount:1,
                    avatar:1,
                    coverImage:1,
                    isSubscribed:1

                }
            }


        
    

    ])

    if(!channel?.length){
        throw new ApiError(404,"channel doesnt exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"channel fetched successfully")
    )
})

const getwatchHistory = asyncHandler(async(req,res)=>{
    const user = User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            "owner":{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"watched hostory fetched successfully")
    )
})


export {
    registerController,
    loginController,
    logoutController,
    refreshAccessTokenController,
    changeCurrentPasswordController,
    getCurrentUserController,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    updateUserController,
    getwatchHistory
};