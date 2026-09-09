---
title: Downloading your purchase
description: Where your NuggScripts files live after buying, how to unzip them without breaking the folder name, and where they go on the server.
sidebar:
  order: 2
---

## Where your files are

After a purchase you get the resource in one of two places, depending on how the
script is distributed:

- **Keymaster** — [keymaster.fivem.net](https://keymaster.fivem.net), under
  **Granted assets**, signed in with the Cfx.re account you bought against. This
  is where escrow-protected resources live. The download is always the current
  version, so come back here for updates rather than hunting for the original
  file.
- **Your store order** — the download link on the order itself, and in the
  confirmation email.

If a purchase has not appeared, check that you are signed in as the same account
you bought with before opening a ticket. That is the single most common cause.

## Unzipping without breaking it

This is the step that catches people, and it is worth being deliberate about.

**The folder name matters.** Every script checks its own folder name at startup
and refuses to run under the wrong one. Unzipping tools love to add a suffix, and
every one of these is wrong:

```
nuggs_multicharacter-main      ← added by a GitHub-style zip
nuggs_multicharacter-v1.0.0    ← version suffix
nuggs_multicharacter (1)       ← added when a file already existed
nuggs_multicharacter copy
```

The folder must be exactly the resource name, lower case, no suffix:

```
nuggs_multicharacter
```

A bracketed parent folder is fine — `[nugg]/nuggs_multicharacter` or
`[qbx]/nuggs_multicharacter` still count as correctly named, because only the
last part of the path is checked.

Rename the folder before you start the server, not after.

## Where it goes

Drop the folder into your `resources` directory, then add it to `server.cfg`:

```cfg
ensure nuggs_multicharacter
```

Order matters. The line must come **after** your framework and after `oxmysql`.

:::caution
`ensure [folder]` starts **every** resource inside a bracketed folder. If you are
replacing an existing script, moving the old one out of any ensured folder is the
only reliable way to stop it — renaming it is not enough.
:::

## Updating later

Replace the folder with the new download, keeping your `config.lua` if the
changelog does not say otherwise, then restart the server. Each script's
changelog lists anything that needs a config change between versions.

- [nuggs_multicharacter changelog](../../nuggs-multicharacter/changelog/)
