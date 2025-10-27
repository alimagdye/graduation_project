import otpMailTemplate from '../mails/templates/otpMail.js';
import mailQueue from '../queues/mailQueue.js';

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
    }
};

export default mailService;
