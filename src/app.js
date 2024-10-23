import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({
    limit: '256kb'
}));
app.use(express.urlencoded({
    extended: true,
    limit: '256kb'
}));
app.use(express.static('public'));
app.use(cookieParser());

// Importing all candidate routes
import candidateRoutes from './routes/candidate.routes.js';

// Use candidate routes
app.use('/api/v1/candidate', candidateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    // console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});


//import all admin routes
import adminAuthRoutes from '../src/admin/adminAuth/admin.routes.js'
import adminCandidateRoutes from '../src/admin/routes/Candidate.admin.js'
import adminJobRoleRoutes from '../src/admin/routes/JobRole.admin.js'
import adminExamRoutes from '../src/admin/routes/Exam.admin.js'
import adminQuickAccessRoutes from '../src/admin/routes/QuickAccess.admin.js'
import adminResultRoutes from '../src/admin/routes/Results.admin.js'

//use admin routes
app.use('/api/v1/admin/auth', adminAuthRoutes)
app.use('/api/v1/admin/candidate', adminCandidateRoutes)
app.use('/api/v1/admin/jobrole', adminJobRoleRoutes)
app.use('/api/v1/admin/exam', adminExamRoutes)
app.use('/api/v1/admin/dashboard/', adminQuickAccessRoutes)
app.use('/api/v1/admin/result', adminResultRoutes)

export { app };
