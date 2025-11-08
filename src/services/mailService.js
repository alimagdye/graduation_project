import otpMailTemplate from '../mails/templates/otpMail.js';
import mailQueue from '../queues/mailQueue.js';
import passwordResetMail from '../mails/templates/passwordResetMail.js';

const mailService = {
    async sendOtpJob(user, otp) {
        const html = otpMailTemplate({ name: user.name, otp });
        
        await mailQueue.add(
            'sendOtpMail', 
            { 
                to: user.email,
                subject: 'Your Verification Code',
                html,
                text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
            }, 
            { 
                attempts: 3, 
                backoff: {
                    type: 'exponential',
                    delay: 5000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        );
    },

    async sendPasswordResetJob(user, resetUrl) {
        const html = passwordResetTemplate({ name: user.name, resetUrl });

        await mailQueue.add(
            'sendPasswordResetMail',
            {
                to: user.email,
                subject: 'Reset Your Password',
                html,
                text: `You requested to reset your password.\n\nClick this link: ${resetUrl}\n\nIf you didn’t request this, please ignore this email.`,
            },
            {
                attempts: 3,
                backoff: { type: 'exponential', delay: 5000 },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );
    },
};

export default mailService;
