import { AsyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

import { Candidate } from '../models/Candidate.models.js';
import { Exam } from '../models/Exam.models.js'
import bcryptjs from 'bcryptjs';
import { generateJwtToken } from '../utils/JwtToken.js'

const loginCandidate = AsyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;



        if (!(username && password)) throw new ApiError(400, 'Credentials are required')


        const isCandidateExists = await Candidate.findOne({ username });
        if (!isCandidateExists) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: 'Candidate not found'
                })
        }

        const isPasswordCorrect = await bcryptjs.compare(password, isCandidateExists.password);
        if (!isPasswordCorrect) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: 'Invalid Credentials'
                })
        }


        const { _id, fullname, email } = isCandidateExists;
        const token = generateJwtToken({ _id, fullname, email });


        const options = {
            secure: process.env.NODE_ENV === 'production', // Secure cookie only in production
            httpOnly: true
        };


        const candidateData = {
            _id,
            fullname,
            email,
            token
        };

        return res
            .status(200)
            .cookie('candidateToken', token, options)
            .json(new ApiResponse(200, candidateData, 'Logged in successfully'));

    } catch (error) {
        console.log(error)
        throw new ApiError(500, error)
    }
});

const getExamOverviewDetails = AsyncHandler(async (req, res) => {
    try {
        const { candidateId } = req.params;

        const candidate = await Candidate.findById(candidateId).populate({
            path: 'assignedExam.exam',
            select: 'title duration examDateAndTime '
        });

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const assignedExams = candidate.assignedExam.map(exam => ({
            _id: exam.exam._id,
            examTitle: exam.exam.title,
            examDuration: exam.exam.duration,
            examDateAndTime: exam.exam.examDateAndTime,
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(200, assignedExams[0], 'Assigned exam fetched successfully')
            );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const getAssignedPaperSetQuestions = AsyncHandler(async (req, res) => {

    try {
        const { candidateId, examId } = req.params;

        const candidate = await Candidate.findById(candidateId).select('-password -jobrole ');

        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const assignedExam = candidate.assignedExam.find(
            exam => exam.exam.toString() === examId
        );

        if (!assignedExam) {
            return res.status(404).json({ message: 'Assigned exam not found' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        const paperSet = exam.paperSets.id(assignedExam.paperSet);
        if (!paperSet) {
            return res
                .status(404)
                .json({ message: 'Paper set not found' });
        }


        if (!exam.attendedBy.includes(candidateId)) {
            exam.attendedBy.push(candidateId)
            await exam.save()
        }


        return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    candidate: {
                        fullname: candidate.fullname,
                        email: candidate.email
                    },
                    examDuration: exam.duration,
                    questions: paperSet.sections,
                    paperSetId: paperSet._id
                }, 'Question Paper fetched successfully')
            );
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

const submitQuestion = AsyncHandler(async (req, res) => {
    try {
        const { examId, papersetId, candidateId, sectionId, questionId, selectedOption } = req.body;

        // Validate required fields
        if ([examId, papersetId, candidateId, sectionId, questionId, selectedOption].some(field => !field || field.trim() === '')) {
            throw new ApiError(400, 'All fields are required');
        }

        // Find the candidate and exam
        const [candidate, exam] = await Promise.all([
            Candidate.findById(candidateId).select("-username -password"),
            Exam.findById(examId)
        ]);

        if (!candidate) throw new ApiError(404, 'Candidate not found');
        if (!exam) throw new ApiError(404, 'Exam not found');

        // Find the paper set, section, and question
        const paperset = exam.paperSets.find(paperset => paperset._id.toString() === papersetId);
        if (!paperset) throw new ApiError(404, 'Paperset not found');

        const section = paperset.sections.find(section => section._id.toString() === sectionId);
        if (!section) throw new ApiError(404, 'Section not found');

        const question = section.questions.find(question => question._id.toString() === questionId);
        if (!question) throw new ApiError(404, 'Question not found');

        // Check if the selected answer is correct and calculate obtained marks
        const isCorrect = question.correctAnswer === selectedOption;
        const obtainedMarks = isCorrect ? question.marks : 0;

        // Find the assigned exam for the candidate
        const candidateExam = candidate.assignedExam.find(exam => exam.exam.toString() === examId);
        if (!candidateExam) throw new ApiError(404, 'Assigned exam not found for the candidate');

        // Find or create the section score entry
        let sectionScore = candidateExam.sectionScores.find(sec => sec.sectionId === sectionId);
        if (!sectionScore) {
            // Section does not exist, create a new section entry and add the initial question
            sectionScore = {
                sectionTitle: section.sectionTitle,
                sectionId,
                questions: [{
                    _id: questionId,
                    questionText: question.text,
                    attended: true,
                    selectedAnswer: selectedOption,
                    correctAnswer: question.correctAnswer,
                    totalMarks: question.marks,
                    obtainedMarks
                }],
                obtainedMarks: isCorrect ? question.marks : 0,
                totalMarks: question.marks
            };
            candidateExam.sectionScores.push(sectionScore);
        } else {
            // Find or create the question entry
            let questionEntry = sectionScore.questions.find(q => q._id === questionId);
            if (!questionEntry) {
                // Question does not exist, create a new question entry
                questionEntry = {
                    _id: questionId,
                    questionText: question.text, // Add question text here
                    attended: true,
                    selectedAnswer: selectedOption,
                    correctAnswer: question.correctAnswer,
                    totalMarks: question.marks,
                    obtainedMarks
                };
                sectionScore.questions.push(questionEntry);

                // Update section obtained marks if the answer is correct
                if (isCorrect) {
                    sectionScore.obtainedMarks += question.marks;
                }
                sectionScore.totalMarks += question.marks;
            } else {
                // Question exists, update the entry
                const wasCorrect = questionEntry.selectedAnswer === question.correctAnswer;

                questionEntry.attended = true;
                questionEntry.selectedAnswer = selectedOption;
                questionEntry.totalMarks = question.marks;
                questionEntry.obtainedMarks = obtainedMarks;
                questionEntry.questionText = question.text; 
                questionEntry.correctAnswer = question.correctAnswer

                // Update section obtained marks if the answer correctness has changed
                if (wasCorrect !== isCorrect) {
                    sectionScore.obtainedMarks += isCorrect ? question.marks : -question.marks;
                }
            }
        }

        // Update overall score and total marks
        candidateExam.score = candidateExam.sectionScores.reduce((sum, sec) => sum + sec.obtainedMarks, 0);
        candidateExam.totalMarks = candidateExam.sectionScores.reduce((sum, sec) => sum + sec.totalMarks, 0);

        // Save the updated candidate record
        await candidate.save();

        return res.status(200).json(new ApiResponse(200, {}, 'Answer submitted successfully'));
    } catch (error) {
        console.error(error);
        throw new ApiError(500, error.message);
    }
});



export {
    loginCandidate,
    getExamOverviewDetails,
    getAssignedPaperSetQuestions,
    submitQuestion
};
