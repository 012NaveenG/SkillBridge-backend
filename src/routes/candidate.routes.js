import { Router } from "express";
import {
    getAssignedPaperSetQuestions,
    getExamOverviewDetails,
    loginCandidate,
    submitQuestion,
} from "../controllers/Candidate.controller.js";
import { CandidateVerifyJWT } from "../Middlewares/VerifyJWT.js";

const router = Router()

router.route('/login').post(loginCandidate)
router.route('/:candidateId/assigned-exams').get(getExamOverviewDetails)
router.route('/:candidateId/exam/:examId/paperset-questions').get(getAssignedPaperSetQuestions)
router.route('/submit-question').post(submitQuestion)


export default router