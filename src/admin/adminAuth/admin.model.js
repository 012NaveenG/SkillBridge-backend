import mongoose, { Schema } from "mongoose";


const adminSchema = new Schema({
    adminName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },

    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

},
    { timestamps: true }
)

const Admin = mongoose.model('Admin', adminSchema)

export { Admin }