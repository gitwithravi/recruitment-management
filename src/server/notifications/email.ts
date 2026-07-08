import "server-only";

import nodemailer from "nodemailer";

const transporter = (() => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
})();

export async function sendEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<boolean> {
  if (!transporter) {
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";

  if (!from) {
    return false;
  }

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });

    return true;
  } catch (error) {
    console.error("email send failed", error);
    return false;
  }
}
