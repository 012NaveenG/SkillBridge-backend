import { Router } from "express";
import {
    addJobRole,
    getAllJobRoles,
    updateJobRole
} from "../controllers/jobroles/JobRoles.admin.js";
import { AdminVerifyJWT } from "../../Middlewares/VerifyJWT.js";

const router = Router()

router.route('/add').post(AdminVerifyJWT, addJobRole)
router.route('/update').post(AdminVerifyJWT, updateJobRole)
router.route('/getalljobroles').get(AdminVerifyJWT, getAllJobRoles)

export default router