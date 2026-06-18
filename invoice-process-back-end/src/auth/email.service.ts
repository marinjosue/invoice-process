import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendResetPasswordEmail(email: string, resetToken: string, userName: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/auth/reset-password/${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Restablecer Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola ${userName},</p>
              <p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>Sistema SMD</strong>.</p>
              <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
              <center>
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </center>
              <p><strong>Este enlace expirará en 10 minutos.</strong></p>
              <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
            </div>
            <div class="footer">
              <p>© 2025 Sistema SMD - Sistema de Liquidación de Importaciones</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Restablecer Contraseña - Sistema SMD',
      html: htmlContent,
    });
  }
}
