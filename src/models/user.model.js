import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema=new mongoose.Schema({
    watchHistory:
    [
        {
            type:mongoose.Schema.Types.ObjectId,  //iskai bad hamesha ref likhtai hain
            ref:'Video'
        }
    ],
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true  // searchable with optimized tareeqa (searching ziyada -> index true kardo)
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true   //fullname per bhi search kar saktai hain
    },
    avatar:{
        type:String,   //cloudnary url just like aws
        required:true
    },
    coverImage:{
        type:String,  //froentend ke headache kis tarah handle karna hai
    },
    password:{
        type:String,   // challenege encrypt karkai rakhai gai and match bhi karna hoga to kis tarah sai hoga?
        required:[true,'password is required'],
    },
    refreshToken:{
        type:String,
    },

},{timestamps:true}); //cretaed at and updated at

userSchema.pre("save",async function(next){    //save honai sai just pehlai password hash kardo middleware hai yai 
    if(!this.isModified("password")) return next();  //agar password modify hua hai tabhi hash karo 
    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model('User',userSchema);  //users name sai store hoga db mai 'lowercase and plural'