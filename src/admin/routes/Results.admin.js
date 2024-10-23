import { Router } from "express";
import {
    getAllPublishedResults,
    getCandidateScoreCard,
    getPaperSetName,
    getRecentExam,
    getResultByExam,
    publishResult
} from "../controllers/results/Result.admin.js";


const router = Router()

router.route('/recent-exam').get(getRecentExam)
router.route('/publish-result/:examid').post(publishResult)
router.route('/get-all-publishedresults').get(getAllPublishedResults)
router.route('/get-paperset-name/:examid').get(getPaperSetName)
router.route('/get-result-by-exam/:examid').get(getResultByExam)
router.route('/get-candidate-score-card/:cid').get(getCandidateScoreCard)



export default router