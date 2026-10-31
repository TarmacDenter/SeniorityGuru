<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sections = [
  { id: 'percentile', title: 'Seniority Percentile' },
  { id: 'adjusted-rank', title: 'Rank, Publication Position, and Roster Size' },
  { id: 'holdability', title: 'Holdable and Qualification Thresholds' },
  { id: 'growth-model', title: 'Growth Assumptions' },
  { id: 'projection-limits', title: 'Projection Limitations' },
  { id: 'threshold-calculator', title: 'Percentile Thresholds' },
  { id: 'data-compatibility', title: 'Import Plugins and Data' },
] as const
</script>

<template>
  <div>
    <SeniorityNavbar title="How It Works" description="Methodology, assumptions, and data limitations" />

    <UContainer class="py-8 max-w-4xl">
      <!-- Table of contents -->
      <UCard variant="subtle" class="mb-8">
        <template #header>
          <h2 class="font-semibold text-sm text-[--ui-text-muted] uppercase tracking-wide">
            On this page
          </h2>
        </template>
        <nav>
          <ul class="flex flex-wrap gap-x-6 gap-y-2">
            <li v-for="section in sections" :key="section.id">
              <a :href="`#${section.id}`" class="text-sm text-primary hover:underline">{{ section.title }}</a>
            </li>
          </ul>
        </nav>
      </UCard>

      <!-- Sections -->
      <div class="space-y-12">
        <!-- Seniority Percentile -->
        <section id="percentile">
          <h2 class="text-xl font-bold mb-3">Seniority Percentile</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              Seniority Percentile is your Rank against the Roster Size of the selected list or Qualification.
              Higher values mean greater seniority. The most senior pilot has a value of 100%.
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              Seniority Percentile = ((N &minus; Rank + 1) / N) &times; 100
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>N is the Roster Size: every row in the selected list or Qualification, retired pilots included. It does not shrink as pilots retire. Rank is your one-based position.</li>
              <li>Displayed values are rounded to one decimal place.</li>
              <li>Rank #1 (most senior) = 100th percentile.</li>
              <li>The most junior pilot (Rank = N) has an unrounded Seniority Percentile of 100/N. For 200 pilots, this is 0.5%.</li>
              <li>On large lists, 100/N can round to 0.0%. For 3,000 pilots, about 0.0333% displays as 0.0%.</li>
              <li>With one pilot (N = 1, Rank = 1), the result is 100%.</li>
            </ul>
            <UAlert color="info" variant="soft" icon="i-lucide-calculator" title="Example"
              description="If you're Rank #50 on a Roster Size of 200, your percentile is ((200 − 50 + 1) / 200) × 100 = 75.5%." />
          </div>
        </section>

        <!-- Rank, Publication Position, Roster Size -->
        <section id="adjusted-rank">
          <h2 class="text-xl font-bold mb-3">Rank, Publication Position, and Roster Size</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              <strong>Rank</strong> is dynamic. It is your one-based position among pilots still active at the
              As-of Date, so more-senior pilots who have retired by then are removed from it.
            </p>
            <p>
              <strong>Publication Position</strong> is static. It is your position in the list as published, with
              retired pilots still counted, so it does not change with the As-of Date.
            </p>
            <p>
              <strong>Roster Size</strong> is fixed. It is the number of rows in the list or Qualification, retired
              pilots included, and it does not change with the As-of Date.
            </p>
            <p>
              <strong>Seniority Percentile</strong> is your Rank against the Roster Size.
            </p>
            <UAlert color="info" variant="soft" icon="i-lucide-calculator" title="Example"
              description="If your Publication Position is #50 and 3 more-senior pilots have retired by the As-of Date, your Rank is #47. The Roster Size is unchanged, so your Seniority Percentile improves." />
            <p class="text-[--ui-text-muted]">
              Retired pilots are removed from Rank but never from Roster Size, so a retirement raises the
              percentile of every pilot junior to it.
            </p>
          </div>
        </section>

        <!-- Holdable and Qualification Thresholds -->
        <section id="holdability">
          <h2 class="text-xl font-bold mb-3">Holdable and Qualification Thresholds</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The <strong>Qualification Threshold</strong> is the most junior active position in a Base,
              Seat, and Fleet combination. Its percentile is the active incumbent's Rank against Roster Size, fixed at the As-of Date.
              The Position view compares your projected company Seniority Percentile
              with that unchanged Qualification Threshold percentile.
              <strong>Holdable</strong> means your projected percentile meets or exceeds that threshold.
            </p>
            <p class="text-[--ui-text-muted]">
              Scheduled retirements and Growth Assumptions affect your projected Seniority Percentile.
              The Qualification Threshold stays fixed at its current value; future Qualification occupancy is not projected.
              Growth Assumptions do not create specific pilots or change Seniority Numbers.
            </p>
            <UAlert color="warning" variant="soft" icon="i-lucide-alert-triangle" title="Important"
              description='"Holdable" is a modeled outcome, not an awarded vacancy or a guarantee of a position. Vacancies, bids, transfers, and awards are not modeled.' />
          </div>
        </section>

        <!-- Growth Modeling -->
        <section id="growth-model">
          <h2 class="text-xl font-bold mb-3">Growth Assumptions</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The optional growth assumption adds a calculated number of junior pilots to the
              Roster Size in projections each year using compound growth:
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              newPilots = round(rosterSize &times; ((1 + rate)<sup>years</sup> &minus; 1))
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>
                Growth <strong>changes your percentile</strong> because it changes the projected
                Roster Size used as the denominator.
              </li>
              <li>
                Growth does <strong>not change your Rank</strong>: hires are junior to you. The model does not add rows or
                assign Seniority Numbers to the simulated pilots. This means equal distribution across quals. Which is
                obviously not
                how that generally works. <em>Per qual growth settings are on the roadmap.</em>
              </li>
              <li>Available range: 0.5%–10% annual growth in 0.5% steps.</li>
              <li>Default: disabled.</li>
            </ul>
          </div>
        </section>

        <!-- Projection Limitations -->
        <section id="projection-limits">
          <h2 class="text-xl font-bold mb-3">Projection Limitations</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The base projection uses scheduled retirement dates from the uploaded seniority list.
              When enabled, the growth assumption changes the projected Roster Size. The following are
              not modeled as individual events:
            </p>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>Specific new-hire rows (growth adds only to the projected Roster Size; New Hire Mode creates one synthetic
                pilot)
              </li>
              <li>Vacancies, bids, transfers, and awards</li>
              <li>Pilot upgrades or downgrades between qualifications</li>
              <li>Base or seat reassignments</li>
              <li>Furloughs or voluntary leaves</li>
              <li>Non-retirement attrition, such as resignations or medical leave.</li>
              <li>Changes to the mandatory retirement age.</li>
              <li>Corrections to source-list data after upload.</li>
            </ul>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-clock" title="Projection Window"
              description="The trajectory ends at your retirement date. If no user retirement date is available, it uses the latest retirement date in the loaded seniority data. Results are directional estimates." />
          </div>
        </section>

        <!-- Percentile Threshold Calculator -->
        <section id="threshold-calculator">
          <h2 class="text-xl font-bold mb-3">Percentile Thresholds</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The threshold calculator finds the first projected year in which your percentile
              reaches a selected target: 50th, 75th, or 90th percentile.
            </p>
            <p>
              The result uses the selected qualification filter and the current growth assumption.
              It follows the same retirement-only trajectory used by the chart.
            </p>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-info" title="Projection horizon"
              description="If the threshold is not reached by the projection end date, the calculator reports that it is not projected. The end date comes from the user retirement date or the latest retirement date in the loaded seniority data." />
          </div>
        </section>
        <!-- Data Compatibility -->
        <section id="data-compatibility">
          <h2 class="text-xl font-bold mb-3">Import Plugins and Data</h2>
          <USeparator class="mb-4" />
          <div class="space-y-6 text-sm text-[--ui-text]">
            <p>
              SeniorityGuru accepts CSV and Excel files (.csv, .xlsx, .xls). Choose an Import Plugin
              that matches your airline when uploading, or use the Generic upload type and map the
              columns yourself.
            </p>

            <!-- Delta -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-graduation-cap" class="size-5 text-primary" />
                Delta Air Lines
              </h3>
              <p class="text-[--ui-text-muted]">
                The Delta Import Plugin processes PBS seniority list exports. It detects the header
                row and prepares the standard fields automatically:
              </p>
              <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
                <li>
                  <strong>Header detection</strong> — finds the row containing
                  <code class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">SENIORITY_NBR</code>,
                  skipping any preamble rows above it
                </li>
                <li>
                  <strong>Column mapping</strong> — maps Delta-specific column names
                  (<code class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">Emp_Nbr</code>,
                  <code class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">Pilot_Hire_Date</code>,
                  etc.) to the standard format automatically
                </li>
                <li>
                  <strong>Category decomposition</strong> — splits the Category column (e.g.
                  <code class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">ATL350A</code>)
                  into Base (ATL), Fleet (350), and Seat (CA/FO)
                </li>
                <li>
                  <strong>Effective date extraction</strong> — reads the list date from preamble rows
                  (e.g. "Seniority List 01Mar2026")
                </li>
                <li>
                  <strong>Missing retire dates</strong> — rows with blank or placeholder retirement dates
                  are set to a far-future sentinel value, flagged, and editable during review
                </li>
              </ul>
            </div>

            <!-- JetBlue -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-plane" class="size-5 text-primary" />
                JetBlue Airways
              </h3>
              <p class="text-[--ui-text-muted]">
                The JetBlue Import Plugin recognizes common ALPA export headers and normalizes
                hire and retirement dates. It handles:
              </p>
              <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
                <li><strong>Header aliases</strong> — recognizes fields such as <code
                    class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">SEN</code>, <code
                    class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">CMID</code>, <code
                    class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">BASE</code>, and <code
                    class="text-xs bg-(--ui-bg-elevated) px-1 py-0.5 rounded">RTRDATE</code>.</li>
                <li><strong>Date normalization</strong> — converts supported M/D/YY and M/D/YYYY date values to the
                  standard
                  date format.</li>
                <li><strong>Unneeded columns</strong> — drops YRS2RTR because the application calculates projections
                  from
                  retirement dates.</li>
              </ul>
            </div>

            <!-- Generic -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-file-spreadsheet" class="size-5 text-primary" />
                Generic / Other Airlines
              </h3>
              <p class="text-[--ui-text-muted]">
                The Generic upload type can prepare other airline spreadsheets when the required
                fields are present. It finds a likely header row and keeps the remaining columns
                available for manual mapping.
              </p>

              <div class="space-y-2">
                <h4 class="font-medium">Required Columns</h4>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="border-b border-(--ui-border)">
                        <th
                          class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-[--ui-text-muted]">
                          Column</th>
                        <th
                          class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-[--ui-text-muted]">
                          Description</th>
                      </tr>
                    </thead>
                    <tbody class="text-[--ui-text-muted]">
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Seniority Number</td>
                        <td class="py-2 px-3">Number assigned to the pilot on the seniority list (1 = most senior); a label, not a Rank</td>
                      </tr>
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Employee Number</td>
                        <td class="py-2 px-3">Unique pilot identifier used to track you across lists</td>
                      </tr>
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Seat</td>
                        <td class="py-2 px-3">CA (Captain) or FO (First Officer)</td>
                      </tr>
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Base</td>
                        <td class="py-2 px-3">Domicile / crew base (e.g. ATL, ORD, LAX)</td>
                      </tr>
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Fleet</td>
                        <td class="py-2 px-3">Aircraft type (e.g. B737, A320, E175)</td>
                      </tr>
                      <tr class="border-b border-(--ui-border)/50">
                        <td class="py-2 px-3 font-medium">Hire Date</td>
                        <td class="py-2 px-3">Date the pilot was hired (most date formats accepted)</td>
                      </tr>
                      <tr>
                        <td class="py-2 px-3 font-medium">Retire Date</td>
                        <td class="py-2 px-3">Projected retirement date (required for trajectory projections)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-xs text-[--ui-text-muted]">
                  <strong>Name</strong> is optional. If the file has a date of birth instead of a
                  retirement date, select the DOB mapping option to derive retirement dates using
                  the mandatory retirement age configured in Settings.
                </p>
              </div>

              <p class="text-[--ui-text-muted]">
                The upload wizard suggests mappings for common column names. Review and confirm
                those suggestions, or manually map each required field in the column-mapping step.
              </p>
            </div>

            <!-- Tips -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base">Preparing a File</h3>
              <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
                <li>
                  <strong>Export a single sheet</strong> — if your workbook has multiple sheets, select the one
                  containing the seniority data. Multi-sheet files will prompt you to pick a sheet during upload.
                </li>
                <li>
                  <strong>Header rows</strong> — supported Import Plugins detect their expected header;
                  the Generic upload type looks for a row with enough populated cells.
                </li>
                <li>
                  <strong>Date formats</strong> — most common formats are accepted: YYYY-MM-DD, MM/DD/YYYY,
                  DD-Mon-YYYY, and more. Consistency within a column helps but is not required.
                </li>
                <li>
                  <strong>DOB to retire date</strong> — if your list has date of birth instead of retirement date,
                  the upload wizard offers a "Derive from DOB" option that uses the mandatory retirement age in
                  Settings.
                </li>
                <li>
                  <strong>File formats</strong> — CSV (.csv), Excel (.xlsx), and legacy Excel (.xls) are all supported.
                </li>
              </ul>
            </div>

            <UAlert color="info" variant="soft" icon="i-lucide-info" title="Import Plugin contributions"
              description="If your airline format is not supported, see the CONTRIBUTING guide for the current process for proposing an Import Plugin." />
          </div>
        </section>
      </div>
    </UContainer>
  </div>
</template>
