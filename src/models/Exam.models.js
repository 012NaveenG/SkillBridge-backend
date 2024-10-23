import mongoose, { Schema } from "mongoose";

const questionSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    marks: {
        type: Number,
        required: true
    },
    correctAnswer: {
        type: String,
        required: true
    }
});

const sectionSchema = new Schema({
    sectionTitle: {
        type: String
    },
    questions: [questionSchema]
});

const paperSetSchema = new Schema({
    title: {
        type: String,
        default: 'Set'
    },
    sections: [sectionSchema]
});

const examSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    jobRole: {
        type: Schema.Types.ObjectId,
        ref: 'JobRole'
    },
    duration: {
        type: Number,
        required: true
    },
    minPassingMarks: {
        type: Number,
        required: true
    },
    examDateAndTime: {
        type: Date,
        required: true
    },

    paperSets: [paperSetSchema],
    assignedCandidates: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Candidate'
        }
    ],
    attendedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'Candidate'
    }],
    passed: {
        type: Number,
        default: 0
    },
    failed: {
        type: Number,
        default: 0
    },
    resultPublished: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Exam = mongoose.model('Exam', examSchema);

export { Exam };
