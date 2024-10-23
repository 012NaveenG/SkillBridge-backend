import { Router } from "express";
import {
    loginAdmin,
    registerAdmin,
    resendOTP,
    verifyOTP
} from "./admin.controller.js";

const router = Router()

router.route('/register').post(registerAdmin)
router.route('/login').post(loginAdmin)
router.route('/verify-otp').post(verifyOTP)
router.route('/resend-otp').post(resendOTP)



export default router