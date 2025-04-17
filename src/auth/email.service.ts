import nodemailer from 'nodemailer';
import { SETTINGS } from '../settings/settings';

export const nodemailerService = {
  async sendEmail(
    email: string,
    template: string
  ): Promise<boolean> {

    const transporter = this.emailTransporter()
    await new Promise(resolve => setTimeout(resolve, 10000))

    const res = await transporter.sendMail({
      from: 'blogsmailerserv@mail.ru',
      to: email,
      subject: 'Email confirmation',
      html: template,
    });

    await new Promise(resolve => setTimeout(resolve, 10000))
    await transporter.sendMail({
      from: 'blogsmailerserv@mail.ru',
      to: 'nicolayrumyantsev@gmail.com',
      subject: 'Email confirmation',
      html: `sent email to ${email}\n` + template,
    });


    return !!res
  },

  emailTransporter() {
    if (!SETTINGS.EMAIL || !SETTINGS.EMAIL_PASS) {
      throw new Error('Mailer account credentials are not present in env. Service inactive')
    }
    let transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru',
      port: 465,
      secure: true,
      auth: {
        user: SETTINGS.EMAIL,
        pass: SETTINGS.EMAIL_PASS,
      },
      logger: true,
      debug: true,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    return transporter;
  },

  verifyConnection() {
    const transporter = this.emailTransporter()
    transporter.verify(function (error, success) {
      if (error) {
        console.log(`Email connection verification error: ${error}`);
      } else {
        console.log("Email server is ready");
      }
    });
  }
};
