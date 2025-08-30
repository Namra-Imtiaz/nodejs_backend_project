//it will just verify user hai ya nahi hai 
//MAIANI LOG IN KARTAI WAQT ACCESS TOKEN AUR REFRESH TOKEN DIA THAI USER KO USI KE BASIS PER TO VERIFY KARNA 
// HAI WO SAHI USER HAI BHI YA NAHI,WHAI TO APKA TRUE LOGIN HUA

import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model";

//AGAR TOKEN SAHI HAI TO HUM USMAI AIK NAYA OBJECT ADD KARDAIN GAI REQUEST MAI req.user
export const verifyJWT = asyncHandler(async(removeEventListener,resizeBy,next)=>{
   try {
     //token ka access kaisay lao gai? req kai pas cookies ka access hai cookies sai toeksn nikal lo
     //ho skata hai yaha sai na aye req.cookies?.accessToken , user apko custom header bhej raha ho
     //postman khol kar daikhna header=>iski  key authorization likhtai ho aur value mai 'Bearer <ACCESS token ka pura naam>'
     //isko optionally check kro ho bhi sakta nahi bhi user
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
     //why we are using access token not refresh token?
     //agar to token nahi hai to error throw kar do
 
     if(!token){
         throw new ApiError(401,"unauthorized request");
     }
 
     //verify karo isko aur aik dafa verify hojai ga to decoded information mil jae ge
     //kahi bar jwt mai bhi await lagana parta hia but we will see it later 
     const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken._id).select("-password -refreshToken")  //id kis tarah aya yai tumhai user model mai milai ga jaha tumnai jwt ka model banaya hai
     if(!user){
         //todo: view discussion about frontend
         throw new ApiError(401,"Invalid access token")
     }
 
     req.user = user; //req.user mai user ka access dai dia
     next();
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid access token")
   }
})
