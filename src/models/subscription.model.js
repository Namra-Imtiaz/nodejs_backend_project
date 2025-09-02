import mongoose,{ Schema } from "mongoose";

const subscriptionModel = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    channel:{   //channel bhi aik user he hai kisi na kisi ka treat it as user
        type:Schema.Types.ObjectId,
        ref:'User'
    }
},{timestamps:true})

export const Subscription = mongoose.model('Subscription',subscriptionModel);
