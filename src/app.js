import express from 'express';
const app=express();
import cors from 'cors';
import cookieParser from 'cookie-parser';

app.use(cors({   //cross origin laga ala origin wala masla 
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({   //to handle forms ka data
    limit:"16kb"
}))
app.use(express.urlencoded({   //to handle url ka data ?,%20
    limit:"16kb",
    extended:true   //to handle object kai object
}))
app.use(express.static("public"))  //to handle images pdfs
app.use(cookieParser());  //to apply crud operations from server to browser 


//import routes
import user from './routes/user.routes.js';
import video from './routes/video.routes.js';
//declaration of routes
app.use('/api/v1/users',user);
app.use('/api/v1/videos',video)
//http://localhost:8000/api/v1/users/register

export {app}