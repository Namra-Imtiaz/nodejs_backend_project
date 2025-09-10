import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  /*
    1. user sai sari info lo pehlai
    2. filter karo(id,title,description)
    3. sort karo
    4. pagination karo(page,limit,skip)
    5. filter lagao with pagination
    6. total count nikalo videos ka
    7. response bhej do
    */
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  let filter = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.owner = userId;
  }

  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  let sort = {};
  if (sortBy && sortType) {
    sort[sortBy] = sortType == "asc" ? 1 : -1;
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  const videos = await Video.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limitNumber);

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        pageNumber,
        limitNumber,
      },
      "videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  /*
    1. sab sai pehlai user sai title aur description lo 
    2. pir multer kai through req.files?.videoFile[0].path check karo dono videofaile aur thubnail ka
    3. agar tumhai na milai to error daina kai yai required hai
    4. phir files ko pehlai cloudinary per upload kro 
    5. agar masla ae to error dai daina
    6. video = phir db mai create kro Video.create -> title,description,videoFile ka url,thumbnail ka url
    7. phir response dai do user ko
    */
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const getLocalPathVideoFile = req.files?.videoFile[0]?.path;
  const getLocalPathThumbnail = req.files?.thumbnail[0]?.path;

  if (!(getLocalPathVideoFile && getLocalPathThumbnail)) {
    throw new ApiError(400, "video file and thumbnail are required fields");
  }

  const videoFile = await uploadOnCloudinary(getLocalPathVideoFile);
  const thumbnail = await uploadOnCloudinary(getLocalPathThumbnail);

  if (!(videoFile?.url && thumbnail?.url)) {
    throw new ApiError(
      500,
      "something went wrong while uploading video and thumbnail on cloudinary"
    );
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "something went wrong while publishing a video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "video created successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Video id not found");
  }

  const localFilePath = req.files?.videoFile[0].path;

  if (!localFilePath) {
    throw new ApiError(400, "file path not found");
  }

  const updatedVideo = await uploadOnCloudinary(localFilePath);
  if (!updatedVideo) {
    throw new ApiError(400, "file is not uploaded on cloudinary");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        videoFile: updatedVideo.url,
      },
    },
    {
      new: true,
    }
  );
  if (!video) {
    throw new ApiError(500, "something went wrong while updating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "video id is not valid");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(400, "something went wrong while deleting a video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "video id not found");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  video.status = video.status === "public" ? "private" : "public";

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video.status, "toggler changed successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
