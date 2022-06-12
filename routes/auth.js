const express = require('express')
const User = require('../models/User')
const router = express.Router()
const { body, validationResult } = require('express-validator');
const otpGenerator = require('otp-generator')
var nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv/config')
const fetchUser = require('../middleware/fetchUser')
const JWT_SECRET = process.env.JWT_SIGN;
// creating user
router.post('/singup', [
    // first checking email user and pass are valid
    body('email', "Enter valid email").isEmail(),
    body('name', 'Enter valid name').isLength({ min: 3 }),
    body('password', "Enter a minimum 8 charcter long password").isLength({ min: 8 }),
    body('Cpassword', "Enter a minimum 8 charcter long password").isLength({ min: 8 })
], async (req, res) => {
    let success = false;
    // console.log(req.body);
    // const user = new User(req.body);
    // user.save()
    // if not valid then print error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.status(400).json({ success,error: "Please enter valid name, email, and password" });
    }
    // if valid then first check email is in databse or not
    try {
        let user = await User.findOne({ email: req.body.email })
        // if its in the database then return error
        if (user) {
            success = false
            return res.status(400).json({ success, error: "Sorry! A user with this email already exist" })
        }
        if(req.body.password !== req.body.Cpassword){
            success = false
            return res.status(400).json({ success, error: "Sorry! check your confirm password" })
        }       
        // if not then create scure pass with bcryptjs hash and salt
        const salt = await bcrypt.genSalt(10)
        const securePass = await bcrypt.hash(req.body.password, salt);
        const secureCPass = await bcrypt.hash(req.body.Cpassword, salt);
        
        // try to create otp first
        const OTP = otpGenerator.generate(6, { lowerCaseAlphabets: false,upperCaseAlphabets: false, specialChars: false });
        // after creating OTP have send user that OTP in mail
        const SecureOTP = await bcrypt.hash(OTP, salt);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.USER_EMAIL,
              pass: process.env.USER_PASS
            }
          });
          var mailOptions = {
            from: process.env.USER_EMAIL,
            to: req.body.email,
            subject: 'From Apna Diary',
            html: `<h4>Welcome To Apna Diary Here is Your <strong> OTP :${OTP} </strong> for verification your Gmail.</h4>`
          };
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        // adding to databaset
        user = await User.create({
            name: req.body.name,
            password: securePass,
            Cpassword: secureCPass,
            email: req.body.email,
            otp: SecureOTP
        })
        // and giving auth token with JWT token
        // const data = {
        //     user: {
        //         id: user.id
        //     }
        // }

        // const authToken = jwt.sign(data, JWT_SECRET);
        // console.log(authToken)
        success = true;
        // res.json(user)
        res.json({success, user })

    } catch (e) {
        success = false;
        // console.error(e.message);
        res.status(500).send({success, error: "Sorry! Internal server error"})
    }
    //   .then(user => res.json(user))
    //   .catch(err=> {console.log(err),
    //   res.json({error: "please enter valid email"})})
    // console.log(user);


})
//verify the email and give acces token
router.post('/verifygmail',[], async(req, res)=>{
    let success = false;
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email })
        if (!user) {
            success= false;
            return res.status(400).json({success, error: "Please Check your Email" })
        }
        const OTPCompare = await bcrypt.compare(otp, user.otp)
        if(!OTPCompare){
            success= false;
            return res.status(400).json({success, error: "OTP Incorrect Please Check!" })
        }
            //    and giving auth token with JWT token
        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET);
        console.log(authToken)
        success = true;
        // res.json(user)
        res.json({success, authToken })
    } catch (e) {
        success = false;
        // console.error(e.message);
        res.status(500).send({success, error: "Sorry! Internal server error"})
    }
})
// log in user
router.post('/login', [
    // first check email pass valid or not
    body('email', "Enter valid email").isEmail(),
    body('password', "password cannot be blank").exists()
], async (req, res) => {
    let success = false;
    // if not then print error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success= false;
        return res.status(400).json({success, errors: errors.array() });
    }
    // if  valid then checking email and password is exist in database
    const { email, password } = req.body;
    try {
        // if not the return error else compare password
        let user = await User.findOne({ email })
        if (!user) {
            success= false;
            return res.status(400).json({success, error: "log in with correct email and passwords" })
        }
        // compare pass with bcrypt.compare function to users enter pass with database pass hash
        const passCompare = await bcrypt.compare(password, user.password)
        //   if not matched then return error
        if (!passCompare) {
            success= false;
            return res.status(400).json({ success, error: "log in with correct email and passwords" })
        }
        // if match then give authtoken same as sign up with jwt
        const data = {
            user: {
                id: user.id
            }
        }

        const authToken = jwt.sign(data, JWT_SECRET);
        console.log(authToken)
        success= true;
        // res.json(user)
        res.json({ success, authToken })

    } catch (error) {
        success= false;
        console.error(error.message);
        res.status(500).send(success,"some error occured")
    }
})

// Get logged in user details after sucessfully log in login required
router.post('/getuser', fetchUser, async (req, res) => {
    //after login check user id and populate data except pass
try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.send(user)

} catch (error) {
    console.error(error.message);
    res.status(500).send("some error occured")
}
})

module.exports = router;