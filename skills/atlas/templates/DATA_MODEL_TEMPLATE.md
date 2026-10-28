# Data model

## Scope

<Inspected revision and relevant schema/runtime variants. A system may persist
files, events or in-memory state without a database.>

## Entities and authority

| Entity / fact | Identity | Authoritative store and writer(s) | Relationships | Derived copies |
| --- | --- | --- | --- | --- |
| <Name> | <Key and scope> | <Area and actual write paths> | <Cardinality/references> | <Cache/index/projection> |

## Constraints and lifecycle

<Identity, uniqueness, consistency boundaries, state transitions, retention,
deletion, replay and schema evolution where applicable. Link canonical area rules
and authoritative schema definitions rather than duplicating their full text.>

## Evidence and gaps

<Source/schema anchors, checked writers, runtime evidence and unresolved ownership
or deployment assumptions. Distinguish schema constraints from type-only claims.
Remove template instructions.>
