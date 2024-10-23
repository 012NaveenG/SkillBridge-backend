import { Router } from "express";
import {
    getCandidates,
    registerCandidate,
    updateCandidate
} from "../controllers/candidates/Candidate.admin.js";
import { AdminVerifyJWT } from "../../Middlewares/VerifyJWT.js";

const router = Router()

router.route('/register').post(AdminVerifyJWT, registerCandidate)
router.route('/update').put( updateCandidate)
router.route('/getcandidates').get(AdminVerifyJWT, getCandidates)

export default router