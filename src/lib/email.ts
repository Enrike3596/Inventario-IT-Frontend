import { apiFetch } from "./api";

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await apiFetch("/api/Email/enviar", {
    method: "POST",
    body: JSON.stringify(message),
  });
}

export async function sendEmailToMany(
  recipients: string[],
  subject: string,
  body: string,
): Promise<void> {
  await apiFetch("/api/Email/enviar-masivo", {
    method: "POST",
    body: JSON.stringify({ recipients, subject, body, isHtml: true }),
  });
}
