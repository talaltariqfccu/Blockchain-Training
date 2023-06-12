import mongoose from "mongoose";

const userSchema = {
    email:{type:String, trim:true},
    password:{type:String, required:true, trim:true},
    token:{type:Number, required:true},
    verified:{type:Boolean},
    registered :{type:Date, default: Date.now},
}

const userModel = mongoose.model('users', userSchema);

export default userModel;