# Use immutable import data and patches

Import pipeline values are immutable. Plugins never mutate source sheets, prepared sheets, rows, or mapped entries; they return derived columns, mapping suggestions, issues, and entry patches. Shared reducers and mappers create each next pipeline state. This makes plugin effects explicit, protects source data, and preserves reliable before-and-after diagnostics.
