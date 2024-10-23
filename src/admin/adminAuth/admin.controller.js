import { AsyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { generateJwtToken } from '../../utils/JwtToken.js';

import bcryptjs from 'bcryptjs';
import { Admin } from './admin.model.js';
import { sendEmail } from '../../utils/SendMail.js';

let adminAuthDetails = []; // global variable to store admin data temporarily for authentication

const registerAdmin = AsyncHandler(async (req, res) => {
    try {
        const { email, adminName, username, password } = req.body;

        if (!(email && adminName && username && password)) throw new ApiError(409, 'All fields are required');

        const isAdminAlreadyExists = await Admin.findOne({
            $or: [{ email }, { username }]
        });

        if (isAdminAlreadyExists) throw new ApiError(400, 'Admin already exists');

        const hashedPassword = await bcryptjs.hash(password, 12);

        if (!hashedPassword) throw new ApiError(501, 'Failed to register admin');

        const adminCreated = await Admin.create({
            email,
            adminName,
            username,
            password: hashedPassword
        });

        if (!adminCreated) throw new ApiError(501, 'Sorry, failed to register admin');

        return res.status(200).json(new ApiResponse(200, {}, 'Admin registered successfully'));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});

const loginAdmin = AsyncHandler(async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!(username && password)) throw new ApiError(409, 'All fields are required');

        const isAdminExists = await Admin.findOne({ username });

        if (!isAdminExists) throw new ApiError(404, 'Admin does not exist');

        const isPasswordCorrect = await bcryptjs.compare(password, isAdminExists.password);
        if (!isPasswordCorrect) {
            return res
                .status(401)
                .json({ message: 'Invalid credentials' });

        }
        var OTP = Math.floor(Math.random() * 10000);

        if (OTP.toString().split('').length < 4) {
            OTP *= 10
        }


        const emailData = {
            subject: "OTP Verification",
            text: `Your One Time Password (OTP) for verification is ${OTP}. This OTP will be valid only for 10 minutes`
        };
        await sendEmail(isAdminExists.email, emailData);

        adminAuthDetails.push({
            admin_id: isAdminExists._id,
            adminEmailId: isAdminExists.email,
            otp: OTP
        });

        console.log(`Admin Auth OTP ---->  ${OTP}`)

        setTimeout(() => {
            adminAuthDetails = adminAuthDetails.filter(admin => admin.admin_id.toString() !== isAdminExists._id.toString());
        }, 600000);

        return res.status(200).json(
            new ApiResponse(200, {
                _id: isAdminExists._id,
                adminEmail: isAdminExists.email
            }, "Please verify your account using the OTP sent to your email")
        );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


const verifyOTP = AsyncHandler(async (req, res) => {
    try {
        const { otp, adminId } = req.body;

        if (!otp) throw new ApiError(409, 'OTP is required');
        const adminOTP = adminAuthDetails.find(admin => admin.admin_id.toString() === adminId);

        if (!adminOTP || adminOTP.otp !== parseInt(otp)) {
            return res
                .status(404)
                .json({ message: 'Incorrect OTP' })
        }

        const admin = await Admin.findById(adminId).select("-password");

        if (!admin) {
            return res
                .status(500)
                .json({ message: 'Failed to verify admin. Please try again' })
        }

        adminAuthDetails = adminAuthDetails.filter(admin => admin.admin_id.toString() !== adminId); // Remove admin from the global variable

        const adminData = {
            _id: admin._id,
            fullname: admin.adminName,
            email: admin.email,
            username: admin.username,
        };
        const token = generateJwtToken(adminData);
        console.log('admin token ---- ', token)

        adminData.token = token

        const options = {
            secure: process.env.NODE_ENV === 'production', // Secure cookie only in production
            httpOnly: true
        };


        return res
            .status(200)
            .cookie('adminToken', token, options)
            .json(
                new ApiResponse(200, adminData, 'Admin verified successfully')
            );
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


const resendOTP = AsyncHandler(async (req, res) => {
    try {
        const { adminId } = req.body;
        console.log(req.body)

        const admin = adminAuthDetails.find(a => a.admin_id.toString() === adminId);
        if (!admin) throw new ApiError(404, 'Admin not found in session. Please log in first.');

        const OTP = Math.floor(Math.random() * 10000);
        if (OTP.toString().split('').length < 4) {
            OTP *= 10
        }

        const emailData = {
            subject: "OTP Verification",
            text: `Your One Time Password (OTP) for verification is ${OTP}. This OTP will be valid only for 10 minutes`
        };
        await sendEmail(admin.adminEmailId, emailData);

        // Update the OTP in the global variable
        admin.otp = OTP;

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "OTP resent successfully"));
    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


export {
    registerAdmin,
    loginAdmin,
    verifyOTP,
    resendOTP
};
