<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sections = [
  { id: 'percentile', title: 'Seniority Percentile' },
  { id: 'adjusted-rank', title: 'Raw and Adjusted Rank' },
  { id: 'holdability', title: 'Holdability and the Plug' },
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
              Seniority percentile expresses your position within the selected list or qualification.
              It is inverted: 100% is the most senior position and 0% is the most junior position.
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              percentile = ((total &minus; rank + 1) / total) &times; 100
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>The calculation uses the selected scope, such as company-wide or a qualification.</li>
              <li>Displayed values are rounded to one decimal place.</li>
              <li>Rank #1 (most senior) = 100th percentile.</li>
              <li>The most junior position = 0th percentile.</li>
            </ul>
            <UAlert color="info" variant="soft" icon="i-lucide-calculator" title="Example"
              description="If you're #50 out of 200 pilots, your percentile is ((200 − 50 + 1) / 200) × 100 = 75.5%." />
          </div>
        </section>

        <!-- Adjusted vs Raw Rank -->
        <section id="adjusted-rank">
          <h2 class="text-xl font-bold mb-3">Raw and Adjusted Rank</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              <strong>Raw rank</strong> is your position among every row in the selected seniority list.
              <strong>Adjusted rank</strong> removes pilots who have retired as of today from the rank
              and total.
            </p>
            <UAlert color="info" variant="soft" icon="i-lucide-calculator" title="Example"
              description="If your raw rank is #50 and 3 more-senior pilots have retired, your adjusted rank is #47. The adjusted total also excludes retired pilots." />
            <p class="text-[--ui-text-muted]">
              The Status by Base / Seat / Fleet table in the My Status view defaults to adjusted values.
              Its toggle switches between adjusted and raw rank, total, and percentile.
            </p>
          </div>
        </section>

        <!-- Holdability & The Plug -->
        <section id="holdability">
          <h2 class="text-xl font-bold mb-3">Holdability and the Plug</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The <strong>plug</strong> is the most junior pilot currently active in a given base,
              fleet, and seat combination. If your seniority number is less than or equal to the
              plug's seniority number, the position is "holdable" in that combination.
            </p>
            <p class="text-[--ui-text-muted]">
              The Position view can project this comparison forward. It removes pilots whose
              retirement date has passed and compares your seniority number with the remaining plug's rank.
              Growth assumptions affect projected percentiles, but do not create specific pilots or
              change seniority numbers.
            </p>
            <UAlert color="warning" variant="soft" icon="i-lucide-alert-triangle" title="Important"
              description='"Holdable" is a calculation based on the current or projected list. It means you would not be the most junior pilot in that qual.' />
          </div>
        </section>

        <!-- Growth Modeling -->
        <section id="growth-model">
          <h2 class="text-xl font-bold mb-3">Growth Assumptions</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The optional growth assumption adds a calculated number of junior pilots to the
              projected total each year using compound growth:
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              newPilots = round(total &times; ((1 + rate)<sup>years</sup> &minus; 1))
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>
                Growth <strong>changes your percentile</strong> because it changes the projected
                total used as the denominator.
              </li>
              <li>
                Growth does <strong>not change your rank</strong>. The model does not add rows or
                assign seniority numbers to the simulated pilots. This means equal distribution across quals. Which is
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
              When enabled, the growth assumption changes the projected total. The following are
              not modeled as individual events:
            </p>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>Specific new-hire rows (growth adds only to the projected total; New Hire Mode creates one synthetic
                pilot)
              </li>
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
                        <td class="py-2 px-3">Integer rank on the seniority list (1 = most senior)</td>
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
