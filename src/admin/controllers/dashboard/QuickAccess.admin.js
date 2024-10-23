import { AsyncHandler } from '../../../utils/AsyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

import { Exam } from '../../../models/Exam.models.js';
import { JobRole } from '../../../models/JobRoles.models.js';
import { Candidate } from '../../../models/Candidate.models.js';

const quickAccessData = AsyncHandler(async (req, res) => {
    try {
        const [exams, candidates] = await Promise.all([
            Exam.find({}),
            Candidate.find({}).select('-username -password')
        ]);

        if (!exams || !candidates) throw new ApiError(404, 'Exams or Candidates data not found');

        const currentDateAndTime = new Date();
        let activeExams = 0;
        let upcomingExams = 0;

        for (const exam of exams) {
            const examStartTime = exam.examDateAndTime;
            const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);

            if (currentDateAndTime >= examStartTime && currentDateAndTime <= examEndTime) {
                activeExams++;
            } else if (currentDateAndTime < examStartTime) {
                upcomingExams++;
            }
        }

        const quickAccessData = {
            totalExams: exams.length,
            totalCandidates: candidates.length,
            activeExams: activeExams,
            upcomingExams: upcomingExams,
        };

        return res
            .status(200)
            .json(new ApiResponse(200, quickAccessData, 'Data fetched successfully'));
    } catch (error) {
        throw new ApiError(500, error);
    }
});

const graphData = AsyncHandler(async (req, res) => {
    try {


        const [candidates, exams] = await Promise.all([
            Candidate.find({}).select("-password"),
            Exam.find({}).select('-paperSets')
        ])

        const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const currentMonth = new Date().getMonth(); // Get the current month (0-11)

        for (const candidate of candidates) {
            const date = candidate.createdAt;
            const month = date.getMonth();

            if (month <= currentMonth) {
                data[month]++;
            }
        }

        const examParticipationData = exams.map((exam, idx) => ({
            title: exam.title,
            assignedCandidates: exam.assignedCandidates.length,
            attendedBy: exam.attendedBy.length
        }))

        // Slice the data array to only include up to the current month
        const filteredData = data.slice(0, currentMonth + 1);

        return res
            .status(200)
            .json(
                new ApiResponse(200, {examParticipationData,filteredData})
            );

    } catch (error) {
        throw new ApiError(500, error);
    }
});

export {
    quickAccessData,
    graphData
}