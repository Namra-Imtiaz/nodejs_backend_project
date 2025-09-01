import { Router } from "express";
import {registerController,loginController, logoutController } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();  //jis tarah express ko initialize kartai ho app variable mai isi tarah router ko bhi kartai hain
router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerController
);

router.route('/login').post(loginController);

//SECURE ROUTES
router.route("/logout").post(verifyJWT,logoutController);



export default router; //Jab tum export defalt karti ho, to import karte waqt koi bhi naam use kar sakti ho:
//import kuchbhi from '../user.route.js'