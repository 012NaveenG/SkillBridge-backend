import jwt from 'jsonwebtoken';
import { AsyncHandler } from '../utils/AsyncHandler.js';

const verifyJWT = (tokenName) => AsyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies[tokenName];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized request' });
        }

        const isTokenValid = jwt.verify(token, process.env.JWT_SECRET);
        if (!isTokenValid) {
            return res.status(401).json({ message: 'Unauthorized request' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const CandidateVerifyJWT = verifyJWT('candidateToken');
const AdminVerifyJWT = verifyJWT('adminToken');

export {
    CandidateVerifyJWT,
    AdminVerifyJWT
};
