import mongoose, {Schema} from "mongoose"
// import bcrypt from "bcrypt"
// import jwt from "jsonwebtoken"


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: [true,'Password is required']
        },
        role: {
            type: String,
            required: true,
            enum:["patient","doctor","hospitalAdmin","authority"],
            default: "patient"
        }
    },{
        timestamps: true
    }
)



export const User = mongoose.model("User",userSchema)