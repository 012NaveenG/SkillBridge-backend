import { Router } from "express";
import {
    addPaperSet,
    addQuestion,
    createExam,
    deletePaperSet,
    deleteQuestion,
    getAllExams,
    getAllPaperSet,
    getExamByJobRole,
    getPaperSet,
    getQuestionsBySections,
    updatePaperSet,
    updateQuestion
} from "../controllers/exams/Exam.admin.js";
import { AdminVerifyJWT } from "../../Middlewares/VerifyJWT.js";

const router = Router()

//Exams Routes
router.route('/create').post(AdminVerifyJWT, createExam)
router.route('/getallexams').get(AdminVerifyJWT, getAllExams)
router.route('/jobrole/:jobroleid').get(AdminVerifyJWT, getExamByJobRole)


//Paperset Routes
router.route('/addpaperset').post(AdminVerifyJWT, addPaperSet)
router.route('/getpaperset/:examId/:papersetId').get(AdminVerifyJWT, getPaperSet)
router.route('/getallpapersets/:examId').get(AdminVerifyJWT, getAllPaperSet)
router.route('/:examId/papersets/:papersetId').delete(AdminVerifyJWT, deletePaperSet)
router.route('/update-paperset').put(AdminVerifyJWT, updatePaperSet)


//Question Routes
router.route('/question').post(AdminVerifyJWT, addQuestion)
router.route('/question').put(AdminVerifyJWT, updateQuestion)
router.route('/question').delete(AdminVerifyJWT, deleteQuestion)
router.route('/question/:examid/:papersetid/:sectionid').get(AdminVerifyJWT, getQuestionsBySections)


export default router