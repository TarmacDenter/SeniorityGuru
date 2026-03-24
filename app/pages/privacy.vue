<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Privacy Policy — SeniorityGuru',
  description: 'How SeniorityGuru handles your data.',
})
</script>

<template>
  <div class="max-w-3xl mx-auto prose prose-sm dark:prose-invert">
    <h1>Privacy Policy</h1>
    <p class="text-muted text-sm">Last updated: March 2026</p>

    <h2>1. Who we are</h2>
    <p>
      SeniorityGuru is a browser-based tool operated by Michael Dempsey.
    </p>

    <h2>2. What we collect</h2>
    <p>
      We do not collect personal data. The app runs entirely in your browser. Any seniority data you
      load is stored locally in your browser's IndexedDB. We never transmit, receive, or store it.
    </p>

    <h2>3. Vercel Analytics</h2>
    <p>
      The app is hosted on Vercel. Vercel Analytics collects aggregate, cookieless traffic data
      (page views, referrers, general location by country). No personal identifiers are collected
      or transmitted.
    </p>

    <h2>4. Cookies</h2>
    <p>
      We set no cookies. There is no authentication session, no tracking cookie, and no third-party
      advertising cookie.
    </p>

    <h2>5. Your data</h2>
    <p>
      All data you load into SeniorityGuru is entirely under your control. It lives in your
      browser's local storage and nowhere else. You can remove it at any time using the Clear Data
      button in Settings, or by clearing your browser's site data for this domain. We have no copy
      to delete on your behalf.
    </p>

    <h2>6. Third parties</h2>
    <p>
      The only third party involved in operating SeniorityGuru is <strong>Vercel, Inc.</strong>,
      which provides static hosting and cookieless analytics. No other third-party services receive
      your data.
    </p>

    <h2>7. Changes to this policy</h2>
    <p>
      If we make material changes to this policy we will post a notice in the application before
      the changes take effect.
    </p>
  </div>
</template>
