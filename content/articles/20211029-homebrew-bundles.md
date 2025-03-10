+++
title = "Unix: Saving and restoring your Homebrew packages"
description = "A small tip to backup and restore all your Homebrew packages"
date = 2021-10-29
[taxonomies]
tags = ["tip", "unix"]
+++

## Context

If you're using the Homebrew package manager on your Mac, there's a small chance you may want to backup your list of packages and to be able to restore them in one command, especially if you got a computer for personal use and another one for professional use, or in case you have to restore your setup for whatever reason.

Homebrew provides bundles that does just that. To create one, just open your terminal and type:

```sh
brew bundle dump
```

This will create a Brewfile containing all custom repositories and the list of all the packages you installed.

To restore it, simply run `brew bundle` and Homebrew will make sure you have all those packages installed.

This isn't something huge, but I thought this deserved a bit of coverage from yet another Github Page :-)
