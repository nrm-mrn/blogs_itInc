import nodemailer from 'nodemailer';
import { SETTINGS } from '../settings/settings';
import { injectable } from 'inversify';

@injectable()
export class MailerService {
  public async sendEmail(
    email: string,
    template: string
  ): Promise<boolean> {

    const transporter = this.emailTransporter()

    const res = await transporter.sendMail({
      from: 'blogsmailerserv@mail.ru',
      to: email,
      subject: 'Email confirmation',
      html: template,
    });

    return !!res
  }

  private emailTransporter() {
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
      // logger: true,
      // debug: true,
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      pool: true,
      maxConnections: 1,
      maxMessages: 5,
      rateDelta: 1000,
      rateLimit: 1,
    });
    return transporter;
  }

  public verifyConnection() {
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
