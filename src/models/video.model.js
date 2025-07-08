import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new mongoose.Schema({
    //mongodb ap ko allow karta hai choti choti media files rakh saktai ho but achi practice nahi hai yai
    videoFile:{
        type:String,  //cloudinary url
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,  //iskai bad ref daina hota hai
        ref:'User'
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,   //cloudnary ap ko url kai sath time bhi bhejta hai to hum wahi sai lain gai
        required:true
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true
    },
},{timestamps:true})
videoSchema.plugin(mongooseAggregatePaginate);
export const Video=mongoose.model('Video',videoSchema);