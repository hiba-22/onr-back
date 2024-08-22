const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';

const {
    MAILING_SERVICE_CLIENT_ID,
    MAILING_SERVICE_CLIENT_SECRET,
    MAILING_SERVICE_REFRESH_TOKEN,
    SENDER_EMAIL_ADDRESS
} = process.env;

const oauth2Client = new OAuth2(
    "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",
    "297377586108-kbblbsafeiq93bqq1sq0ovqvukdokrjq.apps.googleusercontent.com",
    "1//04Ltz6URznx8ICgYIARAAGAQSNwF-L9IrGMAS1xe4gr0kXtPuN-zILliFWihkzWP_JDK-I2jBjDbr7nqxlNfMLMmqmzBw2M7CEJs",
    OAUTH_PLAYGROUND
);

const sendEmail = async (to, url, txt) => {
    try {
        oauth2Client.setCredentials({
            refresh_token: "1//04Ltz6URznx8ICgYIARAAGAQSNwF-L9IrGMAS1xe4gr0kXtPuN-zILliFWihkzWP_JDK-I2jBjDbr7nqxlNfMLMmqmzBw2M7CEJs"
        });

        const accessToken = await oauth2Client.getAccessToken();
        if (!accessToken.token) {
            throw new Error('Failed to create access token');
        }

        const smtpTransport = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: "hibarassas12l@gmail.com",
                clientId: "297377586108-kbblbsafeiq93bqq1sq0ovqvukdokrjq.apps.googleusercontent.com",
                clientSecret: "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",
                refreshToken: "1//04Ltz6URznx8ICgYIARAAGAQSNwF-L9IrGMAS1xe4gr0kXtPuN-zILliFWihkzWP_JDK-I2jBjDbr7nqxlNfMLMmqmzBw2M7CEJs",
                accessToken: accessToken.token
            }
        });

        const mailOptions = {
            from: "hibarassas12l@gmail.com",
            to: to,
            subject: "ONRWEB",
            html: `
                <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
                <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to the ONRWEB.</h2>
                <p>Congratulations! You're almost set to start using ONRWEB.
                    Just click the button below to validate your email address.
                </p>
                <a href=${url} style="background: crimson; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">${txt}</a>
                <p>If the button doesn't work for any reason, you can also click on the link below:</p>
                <div>${url}</div>
                </div>
            `
        };

        const info = await smtpTransport.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
    }
};

module.exports = sendEmail;
