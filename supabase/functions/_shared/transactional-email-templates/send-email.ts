import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { TEMPLATES } from './registry.ts'
import { sendAndClose } from './smtp-lifecycle.ts'

// Server-only: reads SMTP_* secrets. Import from edge functions only — never
// expose sending to the browser.

const FROM_DOMAIN = 'protocolenomos.com'
const DEFAULT_FROM = `Protocol Nomos <contact@${FROM_DOMAIN}>`
const DEFAULT_REPLY_TO = `contact@${FROM_DOMAIN}`

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Kept for call-site stability; SMTP retries re-send the same logical notice. */
  idempotencyKey?: string
  replyTo?: string
}

/**
 * Renders a registered template and sends it through the project SMTP mailbox
 * (same contact@ path as notifications / newsletter).
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const host = Deno.env.get('SMTP_HOST')?.trim()
  const user = Deno.env.get('SMTP_USER')?.trim()
  const password = Deno.env.get('SMTP_PASSWORD')?.trim()
  if (!host || !user || !password) {
    throw new Error('SMTP is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await renderAsync(element)
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const from =
    Deno.env.get('SMTP_FROM')?.trim() ||
    Deno.env.get('NEWSLETTER_FROM_EMAIL')?.trim() ||
    DEFAULT_FROM
  const replyTo = options.replyTo?.trim() || DEFAULT_REPLY_TO
  const port = Number(Deno.env.get('SMTP_PORT')?.trim() || '465')

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password },
    },
  })
  await sendAndClose({
    send: () => client.send({
      from,
      to: recipient,
      subject,
      html,
      content: 'auto',
      replyTo,
    }),
    close: () => client.close(),
  })

  return { sent: true }
}
