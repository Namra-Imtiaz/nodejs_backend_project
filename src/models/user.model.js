import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
//JWT hamara aik berarer token hai means jo usko bear karta hai wo sahi man laitai hain
//yai token jis kai pas bhi hai jo bhi mujhe bhejai ga mai usai data bhej bhej don ga 
//sign method use karna hota hai secret token bhejo and expiry date bhi bhejo
// in env file write access_token_secret,access_token_expiry,refresh_token_secret and refresh_token_expiry
//the expiry of refresh token is always gretaer than access token


//-------------------------------------SUMMARY FOR JWT-----------------------------------------
// JWT (JSON Web Token) ek secure method hai user authentication aur authorization ke liye. Jab user login ya register karta hai, server ek access token aur refresh token generate karta hai.

// Access token short time ke liye valid hota hai (e.g., 15 min) aur frontend (browser/app) me store hota hai.

// Refresh token zyada time ke liye valid hota hai (e.g., 7 days) aur backend/server side par securely rakha jata hai.

// Access token me zyada user data (payload) hota hai, jabke refresh token me sirf user ki ID hoti hai. Jab access token expire ho jaye, refresh token se ek naya access token generate hota hai — isse user ko dobara login karna nahi padta.

// JWT teen parts me hota hai:
// Header (algorithm info), Payload (user data), Signature (tamper-proofing).
// Signature verify karta hai ke token authentic hai ya modify nahi hua.

// JWT me alg (algorithm) define karta hai ke token kaise sign/verify hoga (e.g., HS256).
// Logout ya session expire hone par dono tokens revoke ho jate hain.

// Authentication: Tum ne email & password se login kiya → Server ne JWT diya. (You are authenticated)
// Authorization: Tumne /admin page open kiya → Server JWT check karega, agar tum admin ho to access dega. (You are authorized)


// --------------------------------Bcrypt Summary (Paragraph Form):----------------------------------------
// Bcrypt ek secure hashing algorithm hai jo user passwords ko encrypt nahi balkay hash karta hai, taake woh 
// irreversible ban jayein. Jab koi user register karta hai, to bcrypt uske password ke saath ek random salt add karta 
// hai aur us combination ka ek unique hash generate karta hai, jo database mein store hota hai. Yeh technique isliye 
// use hoti hai taake agar database leak bhi ho jaye, to actual password kisi ko na mile. Jab user login karta hai, to 
// bcrypt compare method ke zariye check karta hai ke user ka enter kiya hua password database mein stored hashed 
// password se match karta hai ya nahi. Bcrypt deliberately slow hota hai taake brute-force attacks ko prevent kiya 
// ja sake. Ismein salt rounds bhi specify kiye jaate hain, jinka zyada number hashing ko aur secure banata hai. 
// Overall, bcrypt password security ke liye modern web applications mein ek widely used aur trusted solution hai.

// --------------------------------Summary: (mongoose-aggregate-paginate-v2)-----------------------------------
// mongoose-aggregate-paginate-v2 aggregation queries ko page-wise divide karne ka tarika deta hai.
// Plugin ko model par laga kar tum aggregatePaginate() function use kar sakte ho.
// Ye function tumhe paginated results deta hai, jo large datasets ke liye perfect hota hai.





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


//userSchema.pre("kon sa event use karna chahtai ho (save,validate,remove,updateOne,deleteOne",async function(next){})  
//pre aik hook hai usko userSchema ke sarai fields ka pata hai 
// dont use arrow function in it please us mai 'this' ka context nahi hota ku kai userSchemea ke he to values ko maniplate karna hai hawa mai code thori chalana hai 
// encruption time laitai hai isliyai [async and await] use kro callback mai 
//yai aik middleware hai to 'next' use hoga (flag ab agai pass kardo)

userSchema.pre("save",async function(next){    //save honai sai just pehlai password hash kardo middleware hai yai ------- pre aik hook hai 
    if(!this.isModified("password")) return next();  //agar password modify hua hai tabhi hash karo -- for e.g: agar user avatar change karkai save kar raha to change mat karo bar bar 
    // this.isModified("string mai pass karna hota hai")  //isModified aik milta hai apko
    // !this.isModified("string mai pass karna hota hai")  -> nagative check nahi hua hai password modify
    this.password=await bcrypt.hash(this.password,10)   //encrypt kardia yaha pai bcrypt.hash(kia encrypt karna hai,kitnai rounds laganai hai salts)
    next()
})

//we need to design our own method to compare the password as you can design your own middleware similarly mongoose allow you to design your own method too
//SchemaName.methods.methodName = async function(jis ko bhi karna hai )
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)   //bcrypt.compare(clear text password,encrypted password)
    //it will return you result in true and false format boolean
    //password: jo user nai field mai likha
    //this.password: jo hashed password hai data base mai
}

//same ap access token ko generate karnai ka bhi method use karsaktai ho apko jitnai methods chhaiye utnai ap apnai schema mai inject kar saktai ho
//dono tokens mai koi difference nahi hai just usage ka difference hai
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            //payload ka name: database sai jo araha
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY  //expiry ko object mai rakhtai hain
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            //payload ka name: database sai jo araha
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY  //expiry ko object mai rakhtai hain
        }
    )
}

export const User = mongoose.model('User',userSchema);  //users name sai store hoga db mai 'lowercase and plural'
//yai jo user hai yai apkai db sai direct contact kar sakta hai ku kai yai moongoose kai through bana hai