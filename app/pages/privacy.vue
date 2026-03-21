<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Privacy Policy — SeniorityGuru',
  description: 'How SeniorityGuru collects, uses, and protects your data.',
})
</script>

<template>
  <div class="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
    <h1>Privacy Policy</h1>
    <p class="text-muted text-sm">Last updated: March 2026</p>

    <h2>1. Who we are</h2>
    <p>
      SeniorityGuru is operated by Michael Dempsey, 3 Jefts Ter, Stoneham MA 02180, USA
      (<ULink to="mailto:support@seniorityguru.com" class="text-primary hover:underline">support@seniorityguru.com</ULink>).
      For the purposes of the EU General Data Protection Regulation (GDPR) and UK GDPR, Michael Dempsey
      is the data controller.
    </p>

    <h2>2. What we collect</h2>
    <p>
      When you create an account we collect your email address. When you upload a seniority list we store
      the derived data (rank, hire dates, retire dates, base, seat, fleet assignments) to power your
      dashboard. We do not store the source file or any metadata about where the list came from.
      We also collect standard server logs (IP address, browser type, pages visited) via Vercel's
      infrastructure.
    </p>

    <h2>3. Lawful basis for processing</h2>
    <p>
      We process your personal data on the basis of <strong>contract performance</strong> (Article 6(1)(b) GDPR)
      — processing is necessary to provide the service you signed up for. We do not rely on consent as a
      lawful basis for core service processing.
    </p>

    <h2>4. How we use it</h2>
    <p>
      Your data is used solely to operate the service — to display your seniority standing, run projections,
      and show comparisons between uploads. We do not sell your data, share it with third parties for
      marketing purposes, or use it to train AI or machine-learning models.
    </p>

    <h2>5. Third-party processors</h2>
    <ul>
      <li>
        <strong>Supabase, Inc.</strong> — database and authentication. Your data is stored in
        Supabase-managed Postgres. Supabase is SOC 2 Type II certified. Data processing is governed
        by a Data Processing Agreement (DPA) incorporating EU Standard Contractual Clauses (Module Two),
        a UK Addendum, and a Swiss Addendum.
      </li>
      <li>
        <strong>Vercel, Inc.</strong> — hosting and edge delivery. Vercel handles request routing and
        serves the application. Data processing is governed by a Data Processing Agreement with Vercel.
      </li>
    </ul>
    <p>
      We do not use third-party analytics that track individual behaviour across the web. Vercel Analytics
      is cookieless and does not track individuals.
    </p>

    <h2>6. International data transfers</h2>
    <p>
      SeniorityGuru is operated from the United States. If you are located in the European Economic Area,
      United Kingdom, or Switzerland, your personal data is transferred to the US under appropriate
      safeguards: EU Standard Contractual Clauses (SCCs) with Supabase cover EEA transfers; a UK Addendum
      covers UK transfers; and a Swiss Addendum covers Swiss transfers. Copies of the applicable SCCs
      are available on request.
    </p>

    <h2>7. Data retention</h2>
    <p>
      Your account data and seniority list data are retained for as long as your account is active.
      Deleting your account permanently removes all associated data, including uploaded lists and derived
      analytics. There is no recovery after deletion.
    </p>

    <h2>8. Your rights</h2>
    <p>
      Depending on your location, you may have the following rights regarding your personal data:
    </p>
    <ul>
      <li><strong>Access</strong> — request a copy of the data we hold about you</li>
      <li><strong>Rectification</strong> — request correction of inaccurate data</li>
      <li><strong>Erasure</strong> — request deletion of your data (you can also do this directly by deleting your account)</li>
      <li><strong>Restriction</strong> — request that we limit how we process your data</li>
      <li><strong>Portability</strong> — request your data in a structured, machine-readable format</li>
      <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
      <li><strong>Withdraw consent</strong> — where processing is based on consent, withdraw it at any time</li>
      <li><strong>Lodge a complaint</strong> — you have the right to lodge a complaint with your local supervisory authority</li>
    </ul>
    <p>
      To exercise any of these rights, contact us at
      <ULink to="mailto:support@seniorityguru.com" class="text-primary hover:underline">support@seniorityguru.com</ULink>.
      We will respond within 30 days.
    </p>

    <h2>9. Cookies</h2>
    <p>
      We use a single session cookie set by Supabase to maintain your login state. This cookie is
      strictly necessary for the service to function. No advertising or tracking cookies are set.
    </p>

    <h2>10. Changes to this policy</h2>
    <p>
      If we make material changes to this policy we will notify you by email or by posting a notice in the
      application before the changes take effect.
    </p>

    <h2>11. Contact</h2>
    <p>
      Questions about this policy or requests to exercise your rights? Email us at
      <ULink to="mailto:support@seniorityguru.com" class="text-primary hover:underline">support@seniorityguru.com</ULink>.
    </p>
  </div>
</template>
