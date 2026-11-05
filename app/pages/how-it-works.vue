<script setup lang="ts">
definePageMeta({ layout: 'default' })

const sections = [
  { id: 'percentile', title: 'Seniority Percentile' },
  { id: 'rank-roster-size', title: 'Rank, Publication Position, and Roster Size' },
  { id: 'hypothetical-placement', title: 'Hypothetical Placement' },
  { id: 'holdability', title: 'Holdable and Qualification Thresholds' },
  { id: 'growth-model', title: 'Growth Assumptions' },
  { id: 'projection-limits', title: 'Projection Limitations' },
  { id: 'threshold-calculator', title: 'Percentile Threshold' },
  { id: 'data-compatibility', title: 'Upload Types and Data' },
] as const

const requiredColumnHeaders = [
  { accessorKey: 'column', header: 'Column' },
  { accessorKey: 'description', header: 'Description' },
]

const requiredColumns = [
  { column: 'Seniority Number', description: 'Company-assigned ordering number (smaller = more senior). Gaps between numbers do not measure distance; Rank does.' },
  { column: 'Employee Number', description: 'Unique pilot identifier used to find you and to track you across lists' },
  { column: 'Seat', description: 'CA (Captain) or FO (First Officer)' },
  { column: 'Base', description: 'Domicile / crew base (e.g. ATL, ORD, LAX)' },
  { column: 'Fleet', description: 'Aircraft type (e.g. B737, A320, E175)' },
  { column: 'Hire Date', description: 'Date the pilot was hired (most date formats accepted)' },
  { column: 'Retire Date', description: 'Scheduled retirement date, or derived from a date of birth column' },
]
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <UPageHeader title="How It Works" description="Methodology, assumptions, and data limitations" class="pt-0 mb-8" />

    <div>
      <!-- Table of contents -->
      <UCard variant="subtle" class="mb-8">
        <template #header>
          <h2 class="font-semibold text-sm text-muted">
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
          <div class="space-y-3 text-sm text-default">
            <p>
              Seniority Percentile is your Rank against the Roster Size of the selected Qualification Scope
              (company-wide when no scope is selected). Higher values mean greater seniority. The most senior
              pilot has a value of 100%.
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              Seniority Percentile = ((N &minus; Rank + 1) / N) &times; 100
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-muted">
              <li>N is the Roster Size: every pilot in the Qualification Scope, retired pilots included. It does not shrink as pilots retire. Rank is your one-based position.</li>
              <li>Displayed values are rounded to one decimal place.</li>
              <li>Rank #1 (most senior) = 100th percentile.</li>
              <li>The most junior pilot (Rank = N) has an unrounded Seniority Percentile of 100/N. For 200 pilots, this is 0.5%.</li>
              <li>On large lists, 100/N can round to 0.0%. For 3,000 pilots, about 0.0333% displays as 0.0%.</li>
              <li>With one pilot (N = 1, Rank = 1), the result is 100%.</li>
            </ul>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-calculator" title="Example"
              description="If you're Rank #50 on a Roster Size of 200, your percentile is ((200 − 50 + 1) / 200) × 100 = 75.5%." />
          </div>
        </section>

        <!-- Rank, Publication Position, Roster Size -->
        <section id="rank-roster-size">
          <h2 class="text-xl font-bold mb-3">Rank, Publication Position, and Roster Size</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              <strong>Rank</strong> is dynamic. It is your one-based position among pilots still active at the
              As-of Date, so more-senior pilots who have retired by then are removed from it. Rank, not
              Seniority Number, measures how far apart two pilots are.
            </p>
            <p>
              <strong>Publication Position</strong> is static. It is your position in the list as published, with
              retired pilots still counted, so it does not change with the As-of Date.
            </p>
            <p>
              <strong>Roster Size</strong> is fixed. It is the number of pilots in the list or Qualification Scope,
              retired pilots included. It does not change with the As-of Date; only Growth Assumptions change it
              in a projection.
            </p>
            <p>
              <strong>Seniority Percentile</strong> is your Rank against the Roster Size.
            </p>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-calculator" title="Example"
              description="If your Publication Position is #50 and 3 more-senior pilots have retired by the As-of Date, your Rank is #47. The Roster Size is unchanged, so your Seniority Percentile improves." />
            <p class="text-muted">
              Retired pilots are removed from Rank but never from Roster Size, so a retirement raises the
              percentile of every pilot junior to it. The active pilot count is shown beside Roster Size, but it
              is never used to calculate a percentile.
            </p>
          </div>
        </section>

        <!-- Hypothetical Placement -->
        <section id="hypothetical-placement">
          <h2 class="text-xl font-bold mb-3">Hypothetical Placement</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              When you select a Qualification Scope you are not in, SeniorityGuru slots you into it by
              Seniority Number. Your Rank, Roster Size, Seniority Percentile, and projections are calculated as
              if you were a pilot in that scope, so the Roster Size is the scope's pilots plus you.
            </p>
            <p>
              Every such value is labeled <strong>Hypothetical Placement in &lt;scope&gt;</strong>. Only a
              retired pilot has no result.
            </p>
            <p class="text-muted">
              New Hire Mode, in Settings, works the same way for a pilot who is not yet on the list: it adds
              one modeled pilot, junior to everyone on the list, in the Base, Seat, and Fleet you choose.
            </p>
          </div>
        </section>

        <!-- Holdable and Qualification Thresholds -->
        <section id="holdability">
          <h2 class="text-xl font-bold mb-3">Holdable and Qualification Thresholds</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              The <strong>Qualification Threshold</strong> is the most junior active position in a Qualification
              (one Base, Seat, and Fleet combination). Its percentile is the active incumbent's Rank against Roster Size,
              measured company-wide and fixed at the As-of Date.
            </p>
            <p>
              The Holdability view, under Current, compares your projected company-wide Seniority Percentile
              with each Qualification Threshold. <strong>Holdable</strong> means your projected percentile meets
              or exceeds that threshold. The <strong>Holdable Year</strong> is the first projection year in which
              it does:
            </p>
            <ul class="list-disc list-inside space-y-1 text-muted">
              <li><strong>Holdable now</strong>: you are already senior to the Qualification's most junior active pilot.</li>
              <li><strong>Holdable from &lt;year&gt;</strong>: the first year your projected percentile meets the threshold.</li>
              <li><strong>Not before your retirement</strong>: the projection ends at your retirement first.</li>
            </ul>
            <p class="text-muted">
              Scheduled retirements and Growth Assumptions change your projected Seniority Percentile.
              The Qualification Threshold stays at its As-of Date value; future Qualification occupancy is not projected.
              Growth Assumptions do not create specific pilots or change Seniority Numbers.
            </p>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-alert-triangle" title="Important"
              description='"Holdable" is a modeled outcome, not an awarded vacancy or a guarantee of a position. Vacancies, bids, transfers, and awards are not modeled.' />
          </div>
        </section>

        <!-- Growth Assumptions -->
        <section id="growth-model">
          <h2 class="text-xl font-bold mb-3">Growth Assumptions</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              Growth Assumptions are optional. When on, they add modeled pilots to the Roster Size of a
              projection using compound annual growth:
            </p>
            <UCard variant="soft" class="font-mono text-sm">
              Added pilots = round(Roster Size &times; ((1 + rate)<sup>years</sup> &minus; 1))
            </UCard>
            <ul class="list-disc list-inside space-y-1 text-muted">
              <li>
                Added pilots are junior to you, so growth <strong>does not change your Rank</strong>. It
                <strong>lowers your projected Seniority Percentile</strong> because the Roster Size grows.
              </li>
              <li>
                Growth adds no list rows and assigns no Seniority Numbers. The same rate applies to every
                Qualification Scope, so growth is assumed to be spread evenly across Qualifications. Real hiring
                rarely is. <em>Per-Qualification growth is on the roadmap.</em>
              </li>
              <li>Range: 0.5%–10% annual growth in 0.5% steps.</li>
              <li>Default: off ("Retirements only"). When switched on, the rate starts at 3.0%/yr.</li>
            </ul>
          </div>
        </section>

        <!-- Projection Limitations -->
        <section id="projection-limits">
          <h2 class="text-xl font-bold mb-3">Projection Limitations</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              Projections use the scheduled retirement dates in the uploaded seniority list.
              When on, Growth Assumptions change the projected Roster Size. The following are
              not modeled as individual events:
            </p>
            <ul class="list-disc list-inside space-y-1 text-muted">
              <li>Specific new-hire rows (Growth Assumptions change only the Roster Size; New Hire Mode adds one
                modeled pilot)
              </li>
              <li>Vacancies, bids, transfers, and awards</li>
              <li>Upgrades or downgrades between Qualifications</li>
              <li>Base or seat reassignments</li>
              <li>Furloughs or voluntary leaves</li>
              <li>Non-retirement attrition, such as resignations or medical leave</li>
              <li>Changes to the mandatory retirement age</li>
              <li>Corrections to source-list data after upload</li>
            </ul>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-clock" title="Projection Through Date"
              description="Projections run through your retirement date. Without one, they run through the latest retirement date in the loaded seniority list. Results are directional estimates." />
          </div>
        </section>

        <!-- Percentile Threshold -->
        <section id="threshold-calculator">
          <h2 class="text-xl font-bold mb-3">Percentile Threshold</h2>
          <USeparator class="mb-4" />
          <div class="space-y-3 text-sm text-default">
            <p>
              The Percentile Threshold calculator, beside the chart in Trajectory › Projection, finds the first
              projected year in which your Seniority Percentile reaches a target you choose.
            </p>
            <p>
              The target is a whole percent between today's Seniority Percentile and the one projected at the
              Projection Through Date. It starts at 50% when that is in range. The result uses the selected
              Qualification Scope and Growth Assumptions, and follows the same trajectory as the chart.
            </p>
            <UAlert color="neutral" variant="subtle" icon="i-lucide-info" title="Projection Through Date"
              description="If the target is not reached by the Projection Through Date, the calculator reports that it is not projected." />
          </div>
        </section>

        <!-- Data Compatibility -->
        <section id="data-compatibility">
          <h2 class="text-xl font-bold mb-3">Upload Types and Data</h2>
          <USeparator class="mb-4" />
          <div class="space-y-6 text-sm text-default">
            <p>
              SeniorityGuru accepts CSV and Excel files (.csv, .xlsx, .xls). When uploading, choose the
              Upload Type that matches your airline's export, or choose Generic spreadsheet and match the
              columns yourself. SeniorityGuru never guesses the Upload Type. Every Upload Type ends at the same
              column-matching and review steps, where you confirm each mapping and can edit any row before saving.
            </p>

            <!-- Delta -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-graduation-cap" class="size-5 text-primary" />
                Delta Air Lines
              </h3>
              <p class="text-muted">
                The Delta Upload Type reads PBS seniority list exports:
              </p>
              <ul class="list-disc list-inside space-y-1 text-muted">
                <li>
                  <strong>Header detection</strong>: finds the row containing
                  <code class="text-xs bg-elevated px-1 py-0.5 rounded">SENIORITY_NBR</code>,
                  skipping any preamble rows above it
                </li>
                <li>
                  <strong>Column matching</strong>: suggests matches for Delta column names
                  (<code class="text-xs bg-elevated px-1 py-0.5 rounded">Emp_Nbr</code>,
                  <code class="text-xs bg-elevated px-1 py-0.5 rounded">Pilot_Hire_Date</code>,
                  etc.)
                </li>
                <li>
                  <strong>Category decomposition</strong>: splits the Category column (e.g.
                  <code class="text-xs bg-elevated px-1 py-0.5 rounded">ATL350A</code>)
                  into Base (ATL), Fleet (350), and Seat (A = CA, B = FO)
                </li>
                <li>
                  <strong>Effective date</strong>: reads the list date from preamble rows
                  (e.g. "Seniority List 01Mar2026")
                </li>
                <li>
                  <strong>Missing retire dates</strong>: blank or "." retirement dates are set to 31 Dec 2099.
                  Those pilots never retire in projections. Correct them in the review step if you know the
                  real date.
                </li>
              </ul>
            </div>

            <!-- JetBlue -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-plane" class="size-5 text-primary" />
                JetBlue Airways
              </h3>
              <p class="text-muted">
                The JetBlue Upload Type reads ALPA seniority list exports:
              </p>
              <ul class="list-disc list-inside space-y-1 text-muted">
                <li><strong>Header detection</strong>: finds the row containing both a seniority column
                  (<code class="text-xs bg-elevated px-1 py-0.5 rounded">SEN</code>) and an employee column
                  (<code class="text-xs bg-elevated px-1 py-0.5 rounded">CMID</code>).</li>
                <li><strong>Column matching</strong>: suggests matches for headers such as <code
                    class="text-xs bg-elevated px-1 py-0.5 rounded">BASE</code>, <code
                    class="text-xs bg-elevated px-1 py-0.5 rounded">HIREDATE</code>, and <code
                    class="text-xs bg-elevated px-1 py-0.5 rounded">RTRDATE</code>. Columns it does not use,
                  such as YRS2RTR, are left unmatched; projections are calculated from retirement dates.</li>
                <li><strong>Name required</strong>: unlike Generic spreadsheet, Name must be matched.</li>
              </ul>
            </div>

            <!-- Generic -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base flex items-center gap-2">
                <UIcon name="i-lucide-sheet" class="size-5 text-primary" />
                Generic spreadsheet
              </h3>
              <p class="text-muted">
                Generic spreadsheet works with any airline's file that has the required columns. It suggests
                matches for common column names and asks you to choose when more than one column could fit.
              </p>

              <div class="space-y-2">
                <h4 class="font-medium">Required Columns</h4>
                <UTable
                  :data="requiredColumns"
                  :columns="requiredColumnHeaders"
                  :ui="{ td: 'whitespace-normal text-muted', th: 'text-muted' }"
                >
                  <template #column-cell="{ row }">
                    <span class="font-medium text-default">{{ row.original.column }}</span>
                  </template>
                </UTable>
                <p class="text-xs text-muted">
                  <strong>Name</strong> is optional for Generic spreadsheet.
                </p>
              </div>
            </div>

            <!-- Tips -->
            <div class="space-y-3">
              <h3 class="font-semibold text-base">Preparing a File</h3>
              <ul class="list-disc list-inside space-y-1 text-muted">
                <li>
                  <strong>Sheets</strong>: if a workbook has more than one sheet, you choose the sheet that
                  holds the seniority list during upload.
                </li>
                <li>
                  <strong>Column heading row</strong>: Delta and JetBlue find their heading row. Generic
                  spreadsheet starts at the first row; choose another Column heading row if your file has
                  title rows above the headings.
                </li>
                <li>
                  <strong>Date formats</strong>: most common formats are accepted, including YYYY-MM-DD,
                  MM/DD/YYYY, and DDMonYYYY.
                </li>
                <li>
                  <strong>Date of birth instead of retire date</strong>: choose "From DOB" for the retirement date
                  when matching columns. Retirement dates are then derived from the Mandatory Retirement Age in
                  Settings.
                </li>
              </ul>
            </div>

            <UAlert color="neutral" variant="subtle" icon="i-lucide-info" title="Airline not listed?"
              description="Use “Don't see your airline?” on the upload page to request a new Upload Type. Until then, Generic spreadsheet can read most files." />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
