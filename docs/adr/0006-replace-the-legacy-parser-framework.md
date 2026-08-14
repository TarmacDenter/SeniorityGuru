# Replace the legacy parser framework without an adapter

The import redesign removes `PreParser` and migrates every shipped upload type to `ImportPlugin` in one change. Generic and JetBlue are rewritten for the new lifecycle; Delta receives a mechanical interface port that preserves its current behavior and tests. Delta sentinel and category semantics will be reconsidered separately. Existing saved seniority lists retain their current schema and data.
