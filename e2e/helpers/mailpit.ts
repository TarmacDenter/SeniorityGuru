/**
 * Mailpit API helpers for reading emails sent by local Supabase.
 * Mailpit is the local SMTP capture server on port 54324.
 */

const MAILPIT_URL = 'http://127.0.0.1:54324'

interface MailpitMessage {
  ID: string
  Subject: string
  From: { Name: string; Address: string }
  To: { Name: string; Address: string }[]
  Created: string
}

interface MailpitMessageFull extends MailpitMessage {
  HTML: string
  Text: string
}

/** Search messages by recipient email */
async function searchMessages(email: string): Promise<MailpitMessage[]> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`)
  if (!res.ok) throw new Error(`Mailpit search failed: ${res.status}`)
  const data = await res.json()
  return data.messages ?? []
}

/** Get the full message by ID */
async function getMessageById(id: string): Promise<MailpitMessageFull> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/message/${id}`)
  if (!res.ok) throw new Error(`Mailpit get message failed: ${res.status}`)
  return res.json()
}

/** Delete all messages */
export async function purgeAllMessages(): Promise<void> {
  await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: 'DELETE' })
}

/**
 * Wait for a new email to arrive for the given address, then return its full body.
 * Polls every 500ms for up to 10 seconds.
 */
export async function waitForEmail(email: string, opts?: { subject?: string; timeoutMs?: number }) {
  const timeout = opts?.timeoutMs ?? 10_000
  const start = Date.now()

  while (Date.now() - start < timeout) {
    const messages = await searchMessages(email)
    const match = opts?.subject
      ? messages.find(m => m.Subject.toLowerCase().includes(opts.subject!.toLowerCase()))
      : messages[0]

    if (match) {
      return getMessageById(match.ID)
    }

    await new Promise(r => setTimeout(r, 500))
  }

  throw new Error(`No email arrived for ${email} within ${timeout}ms`)
}

/** Extract the first href from an HTML email body, decoding HTML entities */
export function extractLink(html: string): string {
  const match = html.match(/href="([^"]+)"/)
  if (!match) throw new Error('No link found in email HTML')
  return match[1].replace(/&amp;/g, '&')
}

/** Extract the OTP code rendered inside the monospace code block of the invite email */
export function extractOtpCode(html: string): string {
  const match = html.match(/family:monospace[^>]*>\s*([^\s<]+)\s*<\/p>/)
  if (!match) throw new Error('No OTP code found in email HTML')
  return match[1].trim()
}
