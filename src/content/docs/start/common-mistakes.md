---
title: Common install mistakes
description: The handful of problems behind most NuggAssassin support tickets — wrong folder name, start order, a second script still running — and the fix for each.
sidebar:
  order: 3
---

Most tickets are one of the following. Work down the list before opening one —
each takes under a minute to check.

## The folder has a suffix

**Symptom:** the resource refuses to start, and the console says so plainly.

**Fix:** rename the folder to exactly the resource name, lower case, with no
`-main`, no version number, no ` (1)`. See [Downloading your
purchase](../downloading/).

## It starts before the framework

**Symptom:** errors about a nil framework object, or players connect and nothing
happens.

**Fix:** in `server.cfg`, the `ensure` line for the script must come after
`oxmysql` and after `es_extended` / `qb-core` / `qbx_core`. `server.cfg` is read
top to bottom and start order follows it.

## The script it replaces is still running

**Symptom:** two of something — two character screens, two menus, a UI that
opens and immediately closes, or settings that will not save.

**Fix:** stop the old resource properly. Renaming its folder is not enough if it
sits inside a bracketed folder that something `ensure`s — move it out of the
resources tree entirely, or delete the `ensure` line for it.

On QBCore and Qbox there is often a **second** thing to disable as well, because
selection and creation ship as separate resources. Skipping the second one is
behind nearly every "clothing and tattoos are not saving" report. The script's
own installation page names both.

## Secrets pasted into config.lua

**Symptom:** works locally, then a token leaks, or a token stops working after
you share your config for support.

**Fix:** Discord bot tokens, Tebex secrets and anything else private belong in
`server.cfg` as convars, never in `config.lua`. Each script's configuration page
shows the exact convar names. Config files get pasted into tickets; assume yours
will be.

## The database was never checked

**Symptom:** the resource starts, but nothing persists between restarts.

**Fix:** confirm `oxmysql` is running and that its connection string points at
the database your framework actually uses. NuggAssassin scripts create the tables
they own on first start — you do not import SQL by hand — but they cannot do that
without a working connection.

## Reading the startup banner

Every NuggAssassin script prints a banner when it starts, naming the framework it
detected, the related resources it found, and every problem it spotted in your
config. It is the fastest diagnosis available and it costs nothing to read.

If you are still stuck after all of this, see [Getting support](../support/).
