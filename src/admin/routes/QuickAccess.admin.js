import { Router } from "express";
import { AdminVerifyJWT } from "../../Middlewares/VerifyJWT.js";
import {
    graphData,
    quickAccessData
} from "../controllers/dashboard/QuickAccess.admin.js";

const router = Router()

router.route('/quick-access').get(quickAccessData)
router.route('/graph-data').get(graphData)

export default router