const jwt=require("jsonwebtoken");
require("../db/conn")
const User=require("../model/userSchema");

const Authenticate= async(req,res,next)=>{
  try{
      const token=req.cookies.jwtoken;
      const verifyToken=await jwt.verify(token, process.env.SECRET_KEY);
      const rootUser=await User.findById(verifyToken._id)
      if (!rootUser){throw new Error('User not Found')}
      req.token=token;
      req.rootUser=rootUser;
      req.userID =rootUser._id;
      return next()
  }
  catch(err){
    res.status(401).send('Unauthorized : No token provided')
      console.log(err);
  }
}
module.exports=Authenticate;