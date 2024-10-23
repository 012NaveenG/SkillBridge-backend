import { AsyncHandler } from '../../../utils/AsyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

import { Exam } from '../../../models/Exam.models.js';
import { JobRole } from '../../../models/JobRoles.models.js';
import { Candidate } from '../../../models/Candidate.models.js';
import { sendEmail } from '../../../utils/SendMail.js';



const getRecentExam = AsyncHandler(async (req, res) => {
    try {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days in milliseconds

        // Fetch exams that finished within the last 2 days
        const recentExams = await Exam.find({
            examDateAndTime: { $lte: now, $gte: twoDaysAgo }
        }).select(" -paperSets ")

        const recentExamData = []
        for (const exam of recentExams) {
            const jobrole = await JobRole.findById(exam.jobRole).select('-candidates -exams -description')
            recentExamData.push({
                _id: exam._id,
                title: exam.title,
                jobrole: jobrole.title,
                totalCandidates: exam.assignedCandidates.length,
                attendedBy: exam.attendedBy.length,
                isPublished: exam.resultPublished

            })
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, recentExamData)
            );
    } catch (error) {
        throw new ApiError(500, error)

    }
})


const publishResult = AsyncHandler(async (req, res) => {
    try {
        const { examid } = req.params;

        const exam = await Exam.findById(examid);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        const jobrole = await JobRole.findById(exam.jobRole);
        if (!jobrole) {
            return res
                .status(404)
                .json({ success: false, message: 'Job Role not found' });
        }

        exam.resultPublished = true;
        await exam.save();


        const candidates = await Promise.all(
            exam.assignedCandidates.map(candidateId => Candidate.findById(candidateId))
        );


        const validCandidates = candidates.filter(candidate => candidate);

        await Promise.all(validCandidates.map(async (candidate) => {
            const assignedExam = candidate.assignedExam.find(exam => exam.exam.toString() === examid);

            if (assignedExam) {
                const { score, totalMarks } = assignedExam;

                const isCandidateAppearedForExam = exam.attendedBy.includes(candidate._id);
                let result;

                if (!isCandidateAppearedForExam) {
                    result = 'Not Appeared';
                } else if (score < exam.minPassingMarks) {
                    result = 'Failed';
                } else {
                    result = 'Passed';
                }

                // Update the result in the candidate's assigned exam
                assignedExam.result = result;

                const emailData = {
                    subject: `Your Exam Result for ${jobrole.title}`,
                    html: `
                        <div style="background-color: #ffffff; margin: 50px auto; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); max-width: 600px;">
                            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #dddddd;">
                                <h1 style="margin: 0;">Exam Result</h1>
                            </div>
                            <div style="padding: 20px 0;">
                                <p>Dear ${candidate.fullname},</p>
                                <p>We are pleased to inform you of your exam results:</p>
                                <p><strong>Exam Date:</strong> ${new Date(exam.examDateAndTime).toLocaleString()}</p>
                                <p><strong>Job Role:</strong> ${jobrole.title}</p>
                                <p><strong>Total Marks:</strong> ${totalMarks}</p>
                                <p><strong>Your Score:</strong> ${score}</p>
                                <p><strong>Result:</strong> ${result}</p>
                                <p>Thank you for your participation.</p>
                                <p>Best regards,</p>
                                <p>TalaKunchi Network Pvt. Ltd.</p>
                            </div>
                            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #dddddd; font-size: 0.9em; color: #888888;">
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    `
                };

                await sendEmail(candidate.email, emailData);
                await candidate.save();
            }
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'Result Published')
            );
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

const getAllPublishedResults = AsyncHandler(async (req, res) => {
    try {
        const exams = await Exam.find({}).select(" -paperSets");

        if (exams.length === 0) {
            throw new ApiError(404, 'No Exams Found');
        }

        const publishedResults = exams.filter(exam => exam.resultPublished === true);

        if (publishedResults.length === 0) {
            return res
                .json({ success: false, message: 'No published exam available' });
        }

        const data = []

        for (const result of publishedResults) {
            const jobrole = await JobRole.findById(result.jobRole)
            data.push({
                _id: result._id,
                title: result.title,
                jobrole: jobrole.title,
                totalCandidates: result.assignedCandidates.length,
                attendedBy: result.attendedBy.length,
                isPublished: result.resultPublished
            })
        }

        return res
            .status(200)
            .json(new ApiResponse(200, data, 'Published results fetched successfully'));
    } catch (error) {
        // Handle errors
        throw new ApiError(500, error.message);
    }
});



const getPaperSetName = AsyncHandler(async (req, res) => {


    try {

        const { examid } = req.params
        const exam = await Exam.findById(examid).select('-jobRole -assignedCandidates -attendedBy')


        if (!exam) return res
            .status(404)
            .json({ success: false, message: 'Exam Not found' })

        const data = []

        for (const set of exam.paperSets) {
            data.push({
                _id: set._id,
                title: set.title
            })
        }


        return res
            .status(200)
            .json(
                new ApiResponse(200, data)
            )

    } catch (error) {
        throw new ApiError(500, error)
    }
})


const getResultByExam = AsyncHandler(async (req, res) => {
    try {
        const { examid } = req.params;
        const { set, candidateName } = req.query;
        const examOverview = await Exam.findById(examid).select('-data -assignedCandidates -attendedBy -passed -failed -paperSets -createdAt -updatedAt -failed -examDateAndTime')
        const exam = await Exam.findById(examid).populate({
            path: 'attendedBy',
            select: '-password'
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'No candidate attended this exam'
            });
        }

        // Filter candidates based on the provided set and candidateName
        let filteredCandidates = exam.attendedBy;

        if (set) {
            filteredCandidates = filteredCandidates.filter(candidate =>
                candidate.assignedExam.some(exam => exam.paperSet === set)
            );
        }

        if (candidateName) {
            const regex = new RegExp(candidateName, 'i'); // Case-insensitive search
            filteredCandidates = filteredCandidates.filter(candidate =>
                regex.test(candidate.fullname)
            );
        }


        return res.status(200).json(
            new ApiResponse(200, {
                examOverview,
                filteredCandidates
            }, 'Result fetched successfully')
        );
    } catch (error) {
        throw new ApiError(500, error);
    }
});

const getCandidateScoreCard = AsyncHandler(async (req, res) => {

    try {

        const { cid } = req.params

        const candidate = await Candidate.findById(cid)
        if (!candidate) return res
            .status(404)
            .json({ success: false, message: 'Candidate not found' })

        const exam = await Exam.findById(candidate.assignedExam[0].exam).select("-assignedCandidates -paperSets -attendedBy")
        
        const sectionsData = candidate.assignedExam[0].sectionScores

        const formatDate = (isoDate) => {
            const date = new Date(isoDate);
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
               
            };
            return date.toLocaleString('en-US', options);
        };



        const formattedDate = formatDate(exam.examDateAndTime);

        const data = {
            fullname: candidate.fullname,
            email: candidate.email,
            contact: candidate.contact,
            result: candidate.assignedExam[0].result,
            sections: sectionsData,
            exam: exam.title,
            examDate: formattedDate,
            score:candidate.assignedExam[0].score,
            totalMarks:candidate.assignedExam[0].totalMarks



        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, data)
            )



    } catch (error) {
        throw new ApiError(500, error)
    }
})




export {
    getRecentExam,
    publishResult,
    getAllPublishedResults,
    getPaperSetName,
    getResultByExam,
    getCandidateScoreCard
}

