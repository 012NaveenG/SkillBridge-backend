

import nodemailer from 'nodemailer';
import dotenv from 'dotenv'
dotenv.config('../.env')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host:'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendEmail = async (recipientEmails, emailData) => {
    try {
        const { subject, text, html } = emailData;

        // Set up email data
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to: recipientEmails, // List of recipients
            subject: subject, // Subject line
        };

        // Add html or text to mailOptions based on availability
        if (html) {
            mailOptions.html = html;
        } else if (text) {
            mailOptions.text = text;
        }

        // Send mail with defined transport object
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent:', info.response);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: error.message };
    }
};

export { sendEmail };
