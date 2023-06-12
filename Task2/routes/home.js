import express from "express";

import { authenticate } from "../middlewares/authentication.js";
import {
  signUpController,
  signUpVerController,
  signInController,
} from "../controllers/homePageController.js";
import { listNFT } from "../controllers/marketPlace.js";
import { mint } from "../controllers/minting.js";
import { uploadFile } from "../middlewares/uploadPicture.js";

const router = express();

// router.use("upload",upload.single(`field`));

router.use(`/upload`, uploadFile);

router.post("/signup", signUpController); //for user signUp
router.post("/verify/:token", signUpVerController); //for user verification
router.post("/signIn",authenticate, signInController); //for signing in
router.post("/upload", mint);

router.post(`/listNft`, listNFT)
// router.post("/mintNft",verifyToken,)
// router.post("/upload", uploadMetadataToIPFS);

export default router;
