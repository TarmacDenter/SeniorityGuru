<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Terms of Service — SeniorityGuru',
  description: 'Terms and conditions for using SeniorityGuru.',
})
</script>

<template>
  <div class="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
    <h1>Terms of Service</h1>
    <p class="text-muted text-sm">Last updated: March 2025</p>

    <h2>1. Acceptance</h2>
    <p>
      By creating an account or using SeniorityGuru you agree to these terms. If you do not agree,
      do not use the service.
    </p>

    <h2>2. What the service does</h2>
    <p>
      SeniorityGuru processes airline seniority spreadsheets you upload and presents derived analytics:
      rank, percentile, position by base and seat, career trajectory projections, and list comparisons.
      All projections are mathematical estimates — they are not career advice and are not guaranteed.
    </p>

    <h2>3. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Upload data you do not have the right to use.</li>
      <li>Attempt to scrape, reverse-engineer, or automate access to the service.</li>
      <li>Use the service for any unlawful purpose.</li>
      <li>Attempt to access other users' data.</li>
    </ul>

    <h2>4. Your data</h2>
    <p>
      You retain ownership of any data you upload. By uploading you grant SeniorityGuru a limited licence
      to store and process that data for the sole purpose of providing the service to you. We do not claim
      any ownership of your data and will not share it with third parties (see our
      <ULink to="/privacy" class="text-primary hover:underline">Privacy Policy</ULink>).
    </p>

    <h2>5. Pricing</h2>
    <p>
      SeniorityGuru is currently free to use. We reserve the right to introduce pricing or impose
      upload-size limits in the future. If we do, we will give you reasonable advance notice before
      any changes take effect.
    </p>

    <h2>6. Disclaimers</h2>
    <p>
      The service is provided "as is" without warranties of any kind. Seniority projections are based on
      publicly available modelling assumptions and historical data — actual outcomes will differ. Do not
      make career decisions based solely on SeniorityGuru projections.
    </p>

    <h2>7. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, SeniorityGuru is not liable for any indirect, incidental,
      or consequential damages arising from your use of the service.
    </p>

    <h2>8. Termination</h2>
    <p>
      You may delete your account at any time. We may suspend or terminate accounts that violate these
      terms. On termination, all your data is permanently deleted.
    </p>

    <h2>9. Changes to these terms</h2>
    <p>
      We may update these terms from time to time. Continued use of the service after changes are posted
      constitutes acceptance of the revised terms.
    </p>

    <h2>10. Contact</h2>
    <p>
      Questions? Email us at
      <ULink to="mailto:support@seniorityguru.com" class="text-primary hover:underline">support@seniorityguru.com</ULink>.
    </p>
  </div>
</template>
