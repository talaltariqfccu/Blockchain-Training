import userModel from "../models/user.js";
import argon2, { hash } from "argon2";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const key = process.env.SECRET_KEY;
const tokenExpireyTime = "600s";

const transpoter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MY_GMAIL_ID,
    pass: process.env.MY_GMAIL_PASSWORD,
  },
});

async function signUpController(req, res) {
  const { email } = req.body;
  const { password } = req.body;

  const oldUser = await userModel.findOne({ email: email });

  if (oldUser) {
    return res.send({ status: "failed", message: "Email already exists" });
  } else {
    const hashedPassword = await argon2.hash(password);

    // console.log(`
    // the hash code is ${hashedPassword}`);
    
    let ran = parseInt(Math.random() * 10000);
    console.log(ran);

    const mailOptions = {
      from: process.env.MY_GMAIL_ID,
      to: email,
      subject: "User verification",
      text: `Your Verification code is ${ran}
        click on the link to verify http://localhost:3007/user/verify/${ran}`,
    };

    transpoter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
      else console.log(`Email sent  ${info}`);
    });

    const newDoc = new userModel({
      email: email,
      password: hashedPassword,
      token: ran,
      verified: false,
    });

    await newDoc.save();

    res.status(201).send(`New User Registeres`);
  }
}

async function signUpVerController(req, res) {
  const verToken = req.params.token;
  console.log(verToken);
  await userModel
    .updateOne({ token: verToken }, { verified: true })
    .then(() => {
      res.send(`User Verified`);
    })
    .catch((error) => {
      console.log(error);
    });
}

async function signInController(req, res) {
  const { email, password } = req.body;

  const user = await userModel
    .find({ email: email })
    .select(["email", "password", "verified"]);
  const hashedPassword = user[0].password;

  if (user[0].email === email && user[0].verified === true) {
    const temp = await argon2.verify(hashedPassword, password);

    if (temp == true) {
      jwt.sign({ user }, key, { expiresIn: tokenExpireyTime }, (err, token) => {
        res.json({
          token,
        });
      });
    } else {
      res.status(404).send(`Wrong Password`);
    }
  } else {
    res.send(`No User Found`);
  }
}



export { signUpController, signUpVerController, signInController };
