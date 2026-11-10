const GITHUB_REQUEST_URL = 'https://github.com/TarmacDenter/SeniorityGuru/issues/new?title=Parser%20request%3A%20%5BAirline%20Name%5D'

/** Where a pilot goes to ask for an Import Plugin for their airline. */
export function useImportPluginRequest() {
  const feedbackEmail = useRuntimeConfig().public.feedbackEmail as string
  const subject = encodeURIComponent('SeniorityGuru: Airline Import Plugin Request')
  return {
    githubUrl: GITHUB_REQUEST_URL,
    mailtoUrl: `mailto:${feedbackEmail}?subject=${subject}`,
  }
}
