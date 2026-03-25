<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sections = [
  { id: 'percentile', title: 'Seniority Percentile' },
  { id: 'adjusted-rank', title: 'Adjusted vs Raw Rank' },
  { id: 'holdability', title: 'Holdability & The Plug' },
  { id: 'growth-model', title: 'Growth Modeling' },
  { id: 'projection-limits', title: 'Projection Limitations' },
  { id: 'threshold-calculator', title: 'Percentile Threshold Calculator' },
  { id: 'data-compatibility', title: 'Data Compatibility' },
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
              <a
                :href="`#${section.id}`"
                class="text-sm text-primary hover:underline"
              >{{ section.title }}</a>
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
              Your percentile shows where you rank among all active pilots on the list.
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              percentile = ((total &minus; rank + 1) / total) &times; 100
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>Rank #1 (most senior) = 100th percentile</li>
              <li>Most junior pilot = ~0th percentile</li>
            </ul>
            <UAlert
              color="info"
              variant="soft"
              icon="i-lucide-calculator"
              title="Example"
              description="If you're #50 out of 200 pilots, your percentile is ((200 − 50 + 1) / 200) × 100 = 75.5%."
            />
          </div>
        </section>

        <!-- Adjusted vs Raw Rank -->
        <section id="adjusted-rank">
          <h2 class="text-xl font-bold mb-3">Adjusted vs Raw Rank</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              <strong>Raw rank</strong> is your position among everyone on the seniority list.
              <strong>Adjusted rank</strong> is your position after removing pilots who have already
              retired.
            </p>
            <UAlert
              color="info"
              variant="soft"
              icon="i-lucide-calculator"
              title="Example"
              description="You're raw #50; 3 senior pilots retired → adjusted rank = 47. Adjusted total = full list minus retired pilots."
            />
            <p class="text-[--ui-text-muted]">
              The toggle in the Position tab switches between these two views.
            </p>
          </div>
        </section>

        <!-- Holdability & The Plug -->
        <section id="holdability">
          <h2 class="text-xl font-bold mb-3">Holdability &amp; The Plug</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The <strong>plug</strong> is the most junior pilot currently active in a given
              qualification (fleet + seat combination). If your seniority number is lower than
              (more senior than) the plug, the position is "holdable" — you have enough seniority
              to hold that qualification.
            </p>
            <UAlert
              color="warning"
              variant="soft"
              icon="i-lucide-alert-triangle"
              title="Important"
              description='"Holdable" is a forward-looking projection based on scheduled retirements, not a guarantee of an open bid or vacancy.'
            />
          </div>
        </section>

        <!-- Growth Modeling -->
        <section id="growth-model">
          <h2 class="text-xl font-bold mb-3">Growth Modeling</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The optional growth rate adds simulated new hires each year using compound growth:
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              newPilots = round(total &times; ((1 + rate)<sup>years</sup> &minus; 1))
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>
                Growth <strong>affects your percentile</strong> (dilutes it — more pilots in the
                denominator)
              </li>
              <li>
                Growth does <strong>NOT change your raw rank</strong> (you're still #50 regardless
                of how many junior pilots join)
              </li>
              <li>Range: 0.5%–10% annual growth</li>
              <li>Default: disabled</li>
            </ul>
          </div>
        </section>

        <!-- Projection Limitations -->
        <section id="projection-limits">
          <h2 class="text-xl font-bold mb-3">Projection Limitations</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              All projections are based solely on scheduled retirements visible in the uploaded
              seniority list. The following are <strong>NOT modeled</strong>:
            </p>
            <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
              <li>New hires (except a single synthetic pilot in New Hire Mode)</li>
              <li>Pilot upgrades or downgrades between qualifications</li>
              <li>Base or seat reassignments</li>
              <li>Furloughs or voluntary leaves</li>
              <li>Non-retirement attrition (resignations, medical, etc.)</li>
              <li>Regulatory changes to mandatory retirement age</li>
            </ul>
            <UAlert
              color="neutral"
              variant="subtle"
              icon="i-lucide-clock"
              title="Projection Window"
              description="Up to 30 years from today, or until your retirement date, whichever is earlier. Treat all figures as directional estimates."
            />
          </div>
        </section>

        <!-- Percentile Threshold Calculator -->
        <section id="threshold-calculator">
          <h2 class="text-xl font-bold mb-3">Percentile Threshold Calculator</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-[--ui-text]">
            <p>
              The threshold calculator estimates when your seniority percentile will cross a target
              (50th, 75th, or 90th percentile).
            </p>
            <p>Three scenarios are modeled:</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <UCard variant="outline">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UBadge color="neutral" variant="soft" size="sm">Base</UBadge>
                  </div>
                  <p class="text-[--ui-text-muted] text-xs">
                    Scheduled retirements as-is.
                  </p>
                </div>
              </UCard>
              <UCard variant="outline">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UBadge color="success" variant="soft" size="sm">Optimistic</UBadge>
                  </div>
                  <p class="text-[--ui-text-muted] text-xs">
                    Retirements occur 10% sooner — retirement dates scaled by &times;0.9.
                  </p>
                </div>
              </UCard>
              <UCard variant="outline">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <UBadge color="warning" variant="soft" size="sm">Pessimistic</UBadge>
                  </div>
                  <p class="text-[--ui-text-muted] text-xs">
                    Retirements occur 10% later — retirement dates scaled by &times;1.1.
                  </p>
                </div>
              </UCard>
            </div>
            <UAlert
              color="neutral"
              variant="subtle"
              icon="i-lucide-info"
              title="Modeling convention"
              description="The ±10% scaling is a modeling convention. If the threshold isn't crossed within 15 years, the calculator shows &quot;not projected within 15 years.&quot;"
            />
          </div>
        </section>
        <!-- Data Compatibility -->
        <section id="data-compatibility">
          <h2 class="text-xl font-bold mb-3">Data Compatibility</h2>
          <USeparator class="mb-4" />
          <div class="space-y-6 text-sm text-[--ui-text]">
            <p>
              SeniorityGuru accepts CSV and Excel files (.csv, .xlsx, .xls). Choose the parser that
              matches your airline when uploading, or use the generic importer for any spreadsheet.
            </p>

            <!-- Delta -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-graduation-cap" class="size-5 text-primary" />
                Delta Air Lines (Native Support)
              </h3>
              <p class="text-[--ui-text-muted]">
                The Delta parser auto-detects and processes PBS seniority list exports. It handles:
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

            <!-- Generic -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-file-spreadsheet" class="size-5 text-primary" />
                Generic / Other Airlines
              </h3>
              <p class="text-[--ui-text-muted]">
                The generic importer works with any airline's spreadsheet. It expects a header row
                followed by data rows.
              </p>

              <div class="space-y-2">
                <h4 class="font-medium">Required Columns</h4>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="border-b border-(--ui-border)">
                        <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-[--ui-text-muted]">Column</th>
                        <th class="text-left py-2 px-3 font-semibold text-xs uppercase tracking-wide text-[--ui-text-muted]">Description</th>
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
                  <strong>Name</strong> is optional and never leaves your device. If your data includes a date of birth
                  instead of a retirement date, the upload wizard can derive the retirement date using the FAA mandatory
                  retirement age of 65.
                </p>
              </div>

              <p class="text-[--ui-text-muted]">
                The importer auto-detects common column names (e.g. "Seniority Number", "Sen Nbr", "SEN_NUM").
                If auto-detection fails, you can manually map each column in the column mapper step.
              </p>
            </div>

            <!-- Tips -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base">Tips for Preparing Your Data</h3>
              <ul class="list-disc list-inside space-y-1 text-[--ui-text-muted]">
                <li>
                  <strong>Export a single sheet</strong> — if your workbook has multiple sheets, select the one
                  containing the seniority data. Multi-sheet files will prompt you to pick a sheet during upload.
                </li>
                <li>
                  <strong>Preamble rows are OK</strong> — title rows, blank rows, and metadata above the header
                  are automatically detected and skipped.
                </li>
                <li>
                  <strong>Date formats</strong> — most common formats are accepted: YYYY-MM-DD, MM/DD/YYYY,
                  DD-Mon-YYYY, and more. Consistency within a column helps but is not required.
                </li>
                <li>
                  <strong>DOB to retire date</strong> — if your list has date of birth instead of retirement date,
                  the upload wizard offers a "Derive from DOB" option that calculates retirement at age 65.
                </li>
                <li>
                  <strong>File formats</strong> — CSV (.csv), Excel (.xlsx), and legacy Excel (.xls) are all supported.
                </li>
              </ul>
            </div>

            <UAlert
              color="info"
              variant="soft"
              icon="i-lucide-info"
              title="Parser contributions welcome"
              description="If your airline's format isn't supported natively, we accept community-contributed parsers. See the CONTRIBUTING guide on GitHub for details."
            />
          </div>
        </section>
      </div>
    </UContainer>
  </div>
</template>
