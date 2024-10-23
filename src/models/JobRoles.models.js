import mongoose, { Schema } from "mongoose";

const jobRoleSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    exams: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Exam'
        }
    ],

    candidates: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Candidate'
        }
    ]

}, {
    timestamps: true
});

const JobRole = mongoose.model('JobRole', jobRoleSchema);

export { JobRole };
