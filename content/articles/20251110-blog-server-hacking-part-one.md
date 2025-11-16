+++
title = "Blog: Hacking my Linux server at home - Part 1"
description = "It is not the destination that matters, it is the journey."
date = 2025-11-10
[taxonomies]
tags = ["blog", "server", "sysadmin", "dev-ops", "k8s"]
+++

## Context
This summer, I went back to hacking my own server at home for fun and educational purposes, and I wanted to start a blog to share the goals, the highs and lows, the ruminations and the moments of great fulfillment.

## Goals
My goals with this small project are:
- To have my own software "forge" and Kubernetes cluster, on which to deploy my pre-alpha apps; basically, I want a cheap staging environment.
- To get back to sysadmin and devops and tinker on some software I really want to try.
- To have a cheaper, and, I hope, more reliable alternative to some online providers.

## The Hardware
From, maybe, 2009 to 2014, I managed a small server at my parents house. It wasn't doing much, and I had picked a cubic Lian-Li case of a smaller frame (ITX or micro-ATX, I don't remember exactly which one that was). This server would act as a file storage server, a Bittorrent client, and, occasionally, a Minecraft server, although the performance wasn't that great.

This server was made a bit redundant when I finally acquired a (Synology) NAS, which I still use to this day, with two 2TB hard disk drives mounted in RAID-1. Now that I think of it, those disks may need to be replaced, but RAID-1 ensures a minimum level of security.

For my new setup, I decided to go for a used Thinkcentre small PC. This may be the first time I buy used hardware, as I usually want my devices to be spot-free, especially for mouses, keyboards, cases and core components (like CPUs and GPUs), but I figured I wouldn't mind this much for a server, especially considering the fact that it came with a brand new NVME (I bought from a reseller). Also, I favored that option rather than buying extra cheap hardware from Aliexpress, or full-blown $3000 rack servers. I do not quite need this war equipment just yet :)

I would have went for an ARM CPU if I have had the possibility, but this wasn't really in the same budget target (I paid roughly 180 EUR for the Thinkcentre). That Ryzen tech will be good enough for a while.

## The Software
I went for Arch Linux for the OS. I used Debian, then Ubuntu for a couple of years before switching to Gentoo, and finally Arch around 2009. Arch combines the benefits of a rolling release OS, without having the need to recompile all of your OS when glibc gets upgraded (hello Gentoo).

Using a rolling release OS might not be wise for a server, but I had a few issues with migrating "regular" setups from one LTS version to another one, and in my experience, the Arch Linux website always mentions breaking changes, so you can almost always repair those small issues before shutting down your machine.

There have been a couple of new distributions more recently though. I typically like to use Alpine a lot for containers images, but I didn't believe its UX would be that great for a "long-lived" server.

There also have been a couple of Arch derivatives that popped up, but I'd rather tinker on user-level software rather than wondering why my Kernel stopped working for no reason. Also, Arch tends (or tended?) to be *minimalistic*, meaning that packaged software often do not vary that much compared to tarballs distributed by the software itself. Also, Arch's wiki has the reputation to be one of the best in the Linux universe.

## Setting things up
So, after creating a bootable USB drive and connecting my small PC with a keyboard, I ended up following the Arch Handbook I followed a decade ago. It went smooth, apart from a tiny obstacle I encountered quite early, at the bootloader prompt.

Around 2010, if I remember correctly, the Linux kernel gained framebuffer support for the TTY. This meant support for wide resolutions, instead of the legacy default (which I believe was 800x600 pixels). This made the terminal look much better, but it also made it completely unreadable for me.

A simple solution for this issue is to simply edit the bootloader command with a shortcut (was it `Tab` or `;` or `,`?) and append `video=800x600` to the kernel arguments. This wasn't pretty on a 21:9 screen, but at least I could read.

The initial setup was pretty straightforward, disk partitioning was kept very simple, with a root and swap partition, along the usual GPT partition that you have to setup to boot.
I followed the Arch handbook, but also asked a LLM to make me a summary for setting up the network, correctly set up locales, things like that. I'm not quite used to the newer `ip addr` commands yet (I was used to `ipconfig`) and I wanted to see how a LLM would fare. It went well.

I quickly finished the initial setup, which was involving:
- Having the server run on both WLAN and Ethernet, which a permanent DHCP-attributed IP address.
- Having a SSH server up and running.
- Having a Gitea server to host my most *precious* source codes.
- Having a PostgreSQL database server for my projects (and Gitea) accessible on my local network.

I won't paste all the commands I used here, but the setup went pretty well. You may not know Gitea: this is an alternative to Gitlab, written in Go. It is still a bit less mature than Gitlab, but it consumes much less memory, is faster, and almost 100% compatible with Github Actions workflow files. Nice! I'll be able to run both Github and Gitea CIs and compare :)

The PostgreSQL setup was pretty straightforward as well, even though I'm not a bit fan of using a database installed with a system package: when you update that package, you typically have to migrate your owl database t othe new format. You probably want to dump your old database before updating then, but this is a bit tedious to do.

Arch provides a legacy package for this purpose, eg. when upgrading from PG 17 to 18, you would be able to install PG 17 binaries in your system to use PG's internal migration tool.

But, to be honest, I'll eventually run Postgres in its own environment eventually, probably in a container so that I can swap binaries at will, with a Docker volume exposing the data folder that I'll be able to migrate easily. This will prevent me from breaking my database when running system updates.

With all that setup, I was able to start pushing my projects to my server. In my next post, I'll detail how I configured my own Gitea CI to be able to run tests, and to deploy on my Kubernetes cluster using Minikube :)
