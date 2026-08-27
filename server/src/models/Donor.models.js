// import mongoose, { Schema } from "mongoose";

// const donorSchema = new Schema(
//     {
//         userId: {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//             unique: true
//         },

//         bloodGroup: {
//             type: String,
//             enum: [
//                 "A+",
//                 "A-",
//                 "B+",
//                 "B-",
//                 "AB+",
//                 "AB-",
//                 "O+",
//                 "O-"
//             ],
//             required: true
//         },

//         location: {
//             type: {
//                 type: String,
//                 enum: ["Point"],
//                 required: true,
//                 default: "Point"
//             },

//             // GeoJSON: [longitude, latitude]
//             coordinates: {
//                 type: [Number],
//                 required: true
//             }
//         },

//         medicalDetails: {
//             type: String,
//             trim: true
//         },

//         status: {
//             type: String,
//             enum: [
//                 "registered",
//                 "underEvaluation",
//                 "eligible",
//                 "notEligible",
//                 "unavailable"
//             ],
//             default: "registered"
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// // For finding donors near a hospital/location
// donorSchema.index({
//     location: "2dsphere"
// });

// export const Donor = mongoose.model("Donor", donorSchema);