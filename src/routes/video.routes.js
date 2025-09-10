import { Router } from "express";
import { getAllVideos, publishAVideo } from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";
const router=Router();
router
    .route('/videos')
    .get(getAllVideos)
    .post(
    upload.fields(
    [
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]
),publishAVideo)

export default router;