import { AsyncHandler } from '../../../utils/AsyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { Candidate } from '../../../models/Candidate.models.js';
import bcryptjs from 'bcryptjs';
import { Exam } from '../../../models/Exam.models.js';
import { JobRole } from '../../../models/JobRoles.models.js';
import { sendEmail } from '../../../utils/SendMail.js';

// Utility function to generate credentials
const generateCredentials = (fullName, email) => {
    const generateUsername = () => {
        const replaceSpace = fullName.replace(/\s+/g, '@').toLowerCase();
        const fullnameArray = replaceSpace.split('');
        let username = '';
        for (let i = 0; i < fullnameArray.length; i++) {
            if (i === '') {
                continue;
            }
            username += fullnameArray[Math.floor(Math.random() * fullnameArray.length)];
        }
        return username;
    };

    const generatePassword = () => {
        const symbols = ['!', '@', '#', '$', '&'];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        const randomNumber = Math.ceil(Math.random() * 100);
        const password = String(email.split('@')[0] + randomNumber + randomSymbol).replace('.', '&');
        return password;
    };

    const username = generateUsername();
    const password = generatePassword();

    return { username, password };
};

const registerCandidate = AsyncHandler(async (req, res) => {
    try {
        const { data, jobroleid, examid } = req.body;

        if (!data || data.length === 0) throw new ApiError(400, 'Candidate data is required');
        if (!(jobroleid && examid)) throw new ApiError(400, 'Job Role and exam are required to assign');

        const [exam, jobrole] = await Promise.all([
            Exam.findById(examid),
            JobRole.findById(jobroleid)
        ]);
        if (!(exam && jobrole)) throw new ApiError(404, 'Invalid exam or job role to be assigned');

        const candidateEmails = data.map(candidate => candidate.email);
        const existingCandidates = await Candidate.find({ email: { $in: candidateEmails } });
        const existingEmails = new Set(existingCandidates.map(candidate => candidate.email));

        const repeatedCandidates = [];
        const errors = [];
        const newCandidates = [];
        const emailPromises = [];

        for (const candidateData of data) {
            const { fullname, email, contact } = candidateData;

            if (existingEmails.has(email)) {
                repeatedCandidates.push(candidateData);
                continue;
            }

            const { username, password } = generateCredentials(fullname, email);
            const hashedPassword = await bcryptjs.hash(password, 12);

            if (!hashedPassword) {
                errors.push({
                    message: 'Failed to hash password',
                    candidate: candidateData
                });
                continue;
            }

            const newCandidate = {
                fullname,
                email,
                contact,
                username,
                password: hashedPassword,
                jobrole: [jobroleid],
                assignedExam: [{
                    exam: examid,
                    paperSet: exam.paperSets[Math.floor(Math.random() * exam.paperSets.length)]._id
                }]
            };
            newCandidates.push(newCandidate);

            const emailData = {
                subject: `Registered For ${jobrole.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #007BFF;">Hi ${fullname},</h2>
                        <p>Congratulations! You have successfully registered for the <strong>${jobrole.title}</strong> examination.</p>
                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <h3>Your Examination Credentials:</h3>
                            <p><strong>Username:</strong> <span style="background-color: #f8f9fa; padding: 5px; border-radius: 5px;">${username}</span></p>
                            <p><strong>Password:</strong> <span style="background-color: #f8f9fa; padding: 5px; border-radius: 5px;">${password}</span></p>
                        </div>
                        <p style="margin-top: 20px;">Good luck with your examination!</p>
                        <br />
                        <p>Best regards,</p>
                        <p>Your Company Team</p>
                    </div>`
            };
            emailPromises.push(sendEmail(email, emailData));
            
            console.log(fullname,"--->",username,password)
        }

        // Perform bulk write for candidates and get inserted IDs
        if (newCandidates.length > 0) {
            const bulkInsertResult = await Candidate.bulkWrite(newCandidates.map(candidate => ({
                insertOne: { document: candidate }
            })));

            const insertedIds = bulkInsertResult.insertedIds;

            // Update exam and job role in batch using inserted IDs
            const candidateIds = Object.values(insertedIds);
            await Promise.all([
                Exam.updateOne({ _id: examid }, { $push: { assignedCandidates: { $each: candidateIds } } }),
                JobRole.updateOne({ _id: jobroleid }, { $push: { candidates: { $each: candidateIds } } })
            ]);
        }

        // Send all emails in parallel
        await Promise.all(emailPromises);

        return res
            .status(201)
            .json(new ApiResponse(201, { repeatedCandidates, errors }, 'Candidates registered successfully'));

    } catch (error) {
        throw new ApiError(500, error.message);
    }
});


const updateCandidate = AsyncHandler(async (req, res) => {
    try {
        const { _id, fullname, email, contact, enabled } = req.body;
        console.log(req.body)

        if (!(_id && fullname && email && contact)) throw new ApiError(400, 'All fields are required')


        const updatedCandidate = await Candidate.findOneAndUpdate(
            { _id },
            { $set: { fullname, email, contact, enabled } },
            { new: true }
        );

        if (!updatedCandidate) throw new ApiError(404, 'Candidate not found')

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Candidate updated successfully'));

    } catch (error) {
        throw new ApiError(500, error)
    }
});

const getCandidates = AsyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        const query = search ? { fullname: new RegExp(search, 'i') } : {};


        const totalCount = await Candidate.countDocuments(query);

        const candidates = await Candidate.find(query)
        .select('-password')
            .skip(parseInt(skip))
            .limit(parseInt(limit))
            .exec();

        const totalPages = Math.ceil(totalCount / limit);

        return res
            .status(200)
            .json(
                new ApiResponse(200, { candidates, totalPages }, 'Candidates fetched successfully')
            )
    } catch (error) {
        throw new ApiError(500, error)
    }
})




export {
    registerCandidate,
    updateCandidate,
    getCandidates,

};
