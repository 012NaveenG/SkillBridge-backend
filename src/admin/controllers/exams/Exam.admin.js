import { AsyncHandler } from '../../../utils/AsyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';

import { Exam } from '../../../models/Exam.models.js';
import { JobRole } from '../../../models/JobRoles.models.js';

//Exam Controllers
const createExam = AsyncHandler(async (req, res) => {
    try {
        const { title, jobRole, duration, minPassingMarks, examDateAndTime } = req.body;


        if (!(title && minPassingMarks && duration && jobRole && examDateAndTime)) {
            throw new ApiError(400, 'All fields are required')
        }

        const isJobroleExists = await JobRole.findById(jobRole);
        if (!isJobroleExists) throw new ApiError(404, 'Job Role not found')

        const isExamAlreadyExists = await Exam.findOne({ title, jobRole });
        if (isExamAlreadyExists) throw new ApiError(409, 'Exam already exists')

        const createdExam = await Exam.create({
            title,
            jobRole,
            duration,
            minPassingMarks,
            examDateAndTime
        });

        if (!createdExam) throw new ApiError(500, 'Failed to create exam')
        isJobroleExists.exams.push(createdExam._id)

        await isJobroleExists.save()


        return res
            .status(201)
            .json(new ApiResponse(201, {}, 'Exam created successfully'));

    } catch (error) {
        throw new ApiError(500, error)
    }
});

const getAllExams = AsyncHandler(async (req, res) => {
    try {


        var allExamData = [];

        const allExams = await Exam.find({});
        if (!allExams || allExams.length === 0) {
            return res
                .status(404)
                .json(new ApiResponse(404, {}, 'Exams not available'));
        }

        allExams.forEach(exam => {
            allExamData.push({
                _id: exam._id,
                title: exam.title,
                papersets: exam.paperSets.length,
                duration: exam.duration,
                minPassingMarks: exam.minPassingMarks
            });
        });

        return res
            .status(200)
            .json(new ApiResponse(200, allExamData, 'Exams fetched successfully'));
    } catch (error) {
        throw new ApiError(500, error)
    }
});

const getExamByJobRole = AsyncHandler(async (req, res) => {
    try {
        const { jobroleid } = req.params;

        if (!jobroleid) throw new ApiError(400, 'Job role id is required to fetch exams');

        const jobRole = await JobRole.findById(jobroleid).populate('exams');
        if (!jobRole) throw new ApiError(404, 'Job role not found');

        if (!jobRole.exams.length) {
            return res
                .status(404)
                .json({ message: 'No exams available for this job role' })
        }

        return res.status(200).json(new ApiResponse(200, jobRole.exams, 'Exams fetched successfully'));

    } catch (error) {
        throw new ApiError(500, error.message || 'Internal server error');
    }
});



//Paper sets controllers
const addPaperSet = AsyncHandler(async (req, res) => {
    try {
        const { examId, title, sections } = req.body;


        if (!examId || !title || !sections || sections.length === 0) {
            throw new ApiError(400, 'Exam ID, title, and at least one section are required')

        }


        const exam = await Exam.findById(examId);
        if (!exam) throw new ApiError(404, 'Exam not found')


        const existingPaperSet = exam.paperSets.find(paperSet => paperSet.title === title);
        if (existingPaperSet) {
            throw new ApiError(409, 'Paper set with this title already exists')

        }


        const paperSet = {
            title,
            sections: sections.map(section => ({
                sectionTitle: section.sectionTitle,
                questions: section.questions
            }))
        };

        exam.paperSets.push(paperSet);
        await exam.save();

        return res
            .status(201)
            .json(new ApiResponse(201, {}, 'Paper set added successfully'));

    } catch (error) {
        throw new ApiError(500, error)

    }
});

const getAllPaperSet = AsyncHandler(async (req, res) => {

    try {

        const { examId } = req.params

        if (!examId) throw new ApiError(400, 'Please provide exam to get its paperset')


        var allPaperSets = []


        const exam = await Exam.findById(examId)
        if (!exam) throw new ApiError(404, 'Exam not found')

        exam.paperSets.map((paperset, idx) => {

            let totalQuestions = 0;
            let totalMarks = 0;


            paperset.sections.forEach(section => {
                totalQuestions += section.questions.length;
                totalMarks += section.questions.reduce((sum, question) => sum + question.marks, 0);
            });


            allPaperSets[idx] = {

                _id: paperset._id,
                title: paperset.title,
                sections: paperset.sections.length,
                questions: totalQuestions,
                totalMarks: totalMarks
            };
        });



        return res
            .status(200)
            .json(
                new ApiResponse(200, { allPaperSets, examTitle: exam.title, }, 'All paper set fetched successfully...')
            )


    } catch (error) {
        throw new ApiError(500, error)
    }
})

const getPaperSet = AsyncHandler(async (req, res) => {

    try {

        const { examId, papersetId } = req.params


        if (!(examId && papersetId)) throw new ApiError(400, 'All fields are required')



        const exam = await Exam.findById(examId)

        if (!exam) throw new ApiError(404, 'Paper set is not found in any exam')
        const paperset = exam.paperSets.find(paperset => paperset._id == papersetId)

        if (!paperset) throw new ApiError(404, 'Paperset is not found in given exam')



        return res
            .status(200)
            .json(
                new ApiResponse(200, paperset, 'Paper set found successfully')
            )


    } catch (error) {
        throw new ApiError(500, error)
    }
})

const updatePaperSet = AsyncHandler(async (req, res) => {

    try {
        const { examId, paperSetId, sections, title } = req.body;


        if (!examId || !paperSetId || (!sections && !title)) throw new ApiError(400, 'Exam ID, Paper Set ID and either title or sections are required')


        const exam = await Exam.findById(examId);
        if (!exam) throw new ApiError(404, 'Exam not found')


        const paperSet = exam.paperSets.id(paperSetId);
        if (!paperSet) throw new ApiError(404, 'Paper set not found in exam')

        if (title) {
            paperSet.title = title;
        }

        if (sections) {
            paperSet.sections = sections.map(section => ({
                sectionTitle: section.sectionTitle,
                questions: section.questions
            }));
        }


        await exam.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, paperSet, 'Paper set updated successfully')
            );
    } catch (error) {
        throw new ApiError(500, error)
    }
})

const deletePaperSet = AsyncHandler(async (req, res) => {

    try {

        const { examId, papersetId } = req.params

        if (!(examId && papersetId)) throw new ApiError(400, 'Please provide paperset id')

        const exam = await Exam.findById(examId)

        if (!exam) throw new ApiError(404, 'This paperset is not available in any exam')

        const paperSetIndex = exam.paperSets.findIndex(paperSet => paperSet._id.toString() === papersetId);

        if (paperSetIndex === -1) throw new ApiError(404, 'Invalid paper set')

        exam.paperSets.splice(paperSetIndex, 1);
        await exam.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'Paper set deleted successfully..')
            );


    } catch (error) {
        throw new ApiError(500, error)
    }
})

const getQuestionsBySections = AsyncHandler(async (req, res) => {

    try {

        const { examid, papersetid, sectionid } = req.params
        if (!(examid && papersetid && sectionid)) throw new ApiError(400, 'Insufficient details to fetch questions from a specific sectios')

        const exam = await Exam.findById(examid)
        if (!exam) throw new ApiError(404, 'Invalid exam id')

        const paperset = exam.paperSets.id(papersetid)
        if (!paperset) throw new ApiError(404, 'Invalid paperset or section')

        const section = paperset.sections.id(sectionid)
        if (!section) throw new ApiError(404, 'Invalid paperset or section')

        return res
            .status(200)
            .json(
                new ApiResponse(200, section, 'Section with questions fetched successfully..')
            )


    } catch (error) {
        throw new ApiError(500, error)
    }
})


//Question controllers
const addQuestion = AsyncHandler(async (req, res) => {

    try {
        const { examId, paperSetId, sectionId, question } = req.body;

        if (!(examId && paperSetId && sectionId && question)) {
            throw new ApiError(400, 'All fields are required');
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            throw new ApiError(404, 'Exam not found');
        }

        const paperSet = exam.paperSets.id(paperSetId);
        if (!paperSet) {
            throw new ApiError(404, 'Paper set not found');
        }

        const section = paperSet.sections.id(sectionId);
        if (!section) {
            throw new ApiError(404, 'Section not found');
        }

        section.questions.push(question);
        await exam.save();

        return res.status(200).json(
            new ApiResponse(200, {}, 'Question added successfully')
        );
    } catch (error) {
        throw new ApiError(500, error)
    }
})

const updateQuestion = AsyncHandler(async (req, res) => {

    try {

        const { examId, paperSetId, questionId, sectionId, question } = req.body
        console.log(req.body)

        if (!(examId && paperSetId && questionId && sectionId && question)) throw new ApiError(400, 'All fields are required')

        const exam = await Exam.findById(examId)

        if (!exam) throw new ApiError(404, 'Unknown question details')

        const paperset = exam.paperSets.id(paperSetId);
        if (!paperset) throw new ApiError(404, 'Paper set not found to update question')

        const section = paperset.sections.id(sectionId);
        if (!section) throw new ApiError(404, 'Section not found for the question to update')

        const questionFound = section.questions.id(questionId);
        if (!questionFound) throw new ApiError(404, 'Invalid question id')

        questionFound.text = question.text
        questionFound.options = question.options
        questionFound.marks = parseInt(question.marks)
        questionFound.correctAnswer = question.correctAnswer

        await exam.save()

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'Question updated successfully')
            )

    } catch (error) {
        throw new ApiError(500, error)
    }
})

const deleteQuestion = AsyncHandler(async (req, res) => {
    try {
        const { examId, paperSetId, sectionId, questionId } = req.query;


        if (!(examId && paperSetId && sectionId && questionId)) {
            throw new ApiError(400, 'All fields are required');
        }


        const exam = await Exam.findById(examId);
        if (!exam) throw new ApiError(404, 'Exam not found');


        const paperSet = exam.paperSets.id(paperSetId);
        if (!paperSet) throw new ApiError(404, 'Paper set not found');


        const section = paperSet.sections.id(sectionId);
        if (!section) throw new ApiError(404, 'Section not found');


        const deletedQuestion = section.questions = section.questions.filter(q => q._id.toString() !== questionId);

        if (!deletedQuestion) throw new ApiError(404, 'Inavalid question id')

        await exam.save();

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'Question deleted successfully')
            );

    } catch (error) {
        throw new ApiError(500, error)
    }
})



export {
    createExam,
    getAllExams,
    getExamByJobRole,
    addPaperSet,
    getAllPaperSet,
    getPaperSet,
    updatePaperSet,
    deletePaperSet,
    getQuestionsBySections,
    addQuestion,
    updateQuestion,
    deleteQuestion
};
