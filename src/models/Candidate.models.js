import mongoose, { Schema } from "mongoose";

const candidateSchema = new Schema({
    jobrole: [
        {
            type: Schema.Types.ObjectId,
            ref: 'JobRole'
        }
    ],
    assignedExam: [
        {
            exam: {
                type: Schema.Types.ObjectId,
                ref: 'Exam'
            },
            paperSet: {
                type: String
            },
            result: {
                type: String,
                enum: ['Not Appeared', 'Passed', 'Failed'],
                default: 'Not Appeared'
            },
            score: {
                type: Number,
                default: 0
            },
            totalMarks: {
                type: Number,
                default: 0
            },
            sectionScores: [
                {
                    sectionId: {
                        type: String
                    },
                    sectionTitle: {
                        type: String
                    },
                    questions: [
                        {
                            _id: String,
                            attended: {
                                type: Boolean,
                                default: false
                            },
                            questionText: {
                                type: String
                            },
                            selectedAnswer: String,
                            correctAnswer: {
                                type: String
                            },
                            totalMarks: Number,
                            obtainedMarks: Number

                        }
                    ],
                    obtainedMarks: {
                        type: Number,
                        default: 0
                    },
                    totalMarks: {
                        type: Number,
                        default: 0
                    }
                }
            ],
            weightageMarks: {
                type: Number,
                default: 0
            }
        }
    ],
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please fill a valid email address']
    },
    contact: {
        type: Number,
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
    enabled: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true
    });

const Candidate = mongoose.model('Candidate', candidateSchema);

export { Candidate };
