import jwt from 'jsonwebtoken'
import { ApiError } from './ApiError.js'


export const generateJwtToken = (payloadData) => {

    try {

        const token = jwt.sign(
            payloadData,
            process.env.JWT_SECRET,
            {
                expiresIn: 60 * 60 * 1000
            }
        )

        if (!token) throw new ApiError(501, 'Failed to generate jwt token')

        return token



    } catch (error) {
        throw new ApiError(500, error.message)
    }
}