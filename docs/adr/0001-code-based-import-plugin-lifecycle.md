# Code-based import plugin lifecycle

SeniorityGuru import plugins use a small code lifecycle: sheet preparation and optional mapped-entry transformation. Plugin selection is explicit, so a separate recognition hook would not affect control flow. Shared helpers cover common work. We rejected a declarative parser configuration because airline-specific exceptions would turn it into a less testable, less familiar programming language.
