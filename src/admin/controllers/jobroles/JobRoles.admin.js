import { AsyncHandler } from '../../../utils/AsyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

import { JobRole } from '../../../models/JobRoles.models.js';


const addJobRole = AsyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;


        if (!(title && description)) throw new ApiError(400, 'All fields are required')


        const isJobAlreadyExists = await JobRole.findOne({ title });
        if (isJobAlreadyExists) throw new ApiError(409, 'Job Role already exists')


        const createdJob = await JobRole.create({ title, description });

        if (!createdJob) throw new ApiError(500, 'Failed to add job role')

        return res
            .status(201)
            .json(
                new ApiResponse(201, { createdJob }, 'Job role added successfully')
            );

    } catch (error) {
        throw new ApiError(500, error)
        return res
            .status(500)
            .json(new ApiError(500, error.message || 'Internal server error'));
    }
});

const updateJobRole = AsyncHandler(async (req, res) => {
    try {
        const { _id, title, description } = req.body;


        if (!(title && description)) throw new ApiError(400, 'All fields are required')

        const updatedJobRole = await JobRole.findByIdAndUpdate(_id, { title, description }, { new: true });

        if (!updatedJobRole) throw new ApiError(404, 'job role not found')

        return res
            .status(200)
            .json(
                new ApiResponse(200, { updatedJobRole }, 'Job role updated successfully')
            );

    } catch (error) {
        throw new ApiError(500, error)

    }
});

const getAllJobRoles = AsyncHandler(async (req, res) => {

    try {

        const allJobroles = await JobRole.find({}).select('-candidates')
        if (allJobroles.length < 0) throw new ApiError(404, 'No any Job Roles Found')

        return res
            .status(200)
            .json(
                new ApiResponse(200, allJobroles, 'job roles fetched successfully')
            )

    } catch (error) {
        throw new ApiError(500, error)
    }

})
export {
    addJobRole,
    updateJobRole,
    getAllJobRoles
};
