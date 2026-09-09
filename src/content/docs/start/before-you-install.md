---
title: Before you install
description: The server artifact, OneSync mode, database and framework every NuggAssassin script assumes — and how to check each one in under a minute.
sidebar:
  order: 1
---

Five minutes here saves an evening of support tickets. Every NuggAssassin script
assumes the same baseline, and almost every "it will not start" report turns out
to be one of these four things.

## The baseline

| | |
| --- | --- |
| Server artifact | 10188 or newer |
| OneSync | Infinity — `onesync infinity` in `server.cfg` |
| Database | `oxmysql` |
| Framework | one of `es_extended`, `qb-core`, `qbx_core` |

Individual scripts may add to this list. The requirements section on each
script's own installation page is the authority — this is the floor, not the
whole picture.

## Checking each one

### Artifact version

Type `version` in your server console. You get a build number back. If it is
below 10188, update your artifacts before going any further: several natives the
scripts rely on simply do not exist on older builds, and the failure mode is a
confusing error rather than a clear one.

Windows builds come from the [FiveM artifacts
server](https://runtime.fivem.net/artifacts/fivem/build_server_windows/master/).
Take a recommended build rather than the newest one.

### OneSync

Your `server.cfg` needs:

```cfg
onesync infinity
```

Not `onesync legacy`, and not `onesync on`. Infinity is what the entity and
player-slot handling in these scripts is written against.

### oxmysql

`ensure oxmysql` must appear in `server.cfg`, and it must appear **before** any
script that talks to the database — which is all of them. If you are still on
`mysql-async` or `ghmattimysql`, move to
[oxmysql](https://github.com/overextended/oxmysql) first. There is no
compatibility shim.

### Framework

One of `es_extended`, `qb-core` or `qbx_core` must be running and must start
**before** the script. Scripts detect which one you are on at startup and adapt;
you do not tell them.

## What you do not need

- **`nugg_bridge` is not required.** Some NuggAssassin scripts use it, some carry
  their own framework layer instead. Where a script does not use it, installing
  it changes nothing and removing it breaks nothing. Each script's page says
  which applies.
- **No `ox_lib`, no target resource, no compatibility layer** unless a specific
  script's requirements table names one.

## Then

Head to the installation page for the script you bought:

- [nuggs_multicharacter](../../nuggs-multicharacter/installation/)
