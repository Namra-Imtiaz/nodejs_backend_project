import { Router } from "express";
import {registerController,
        loginController, 
        logoutController, 
        changeCurrentPasswordController, 
        getCurrentUserController, 
        updateUserController, 
        updateAvatar, 
        updateCoverImage, 
        getUserChannelProfile, 
        getwatchHistory 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessTokenController } from "../controllers/user.controller.js";
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

router.route("/refresh-token").post(refreshAccessTokenController);

router.route("/change-password").post(verifyJWT,changeCurrentPasswordController);

router.route("/current-user").get(verifyJWT,getCurrentUserController);

router.route("/update-user").patch(verifyJWT,updateUserController);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);

router.route("/c/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getwatchHistory);



export default router; //Jab tum export defalt karti ho, to import karte waqt koi bhi naam use kar sakti ho:
//import kuchbhi from '../user.route.js'