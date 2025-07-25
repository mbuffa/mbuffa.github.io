+++
title = "Unix: Loading env variables, without messing up your environment"
description = "A clean way to load env variables locally"
date = 2025-02-27
[taxonomies]
tags = ["tip", "unix", "dotenv"]
+++

## Context

If you're developing a server or a web app, and this server needs to interact with third-party services, you're probably going to use a `.env` (dotenv) file to define those variables. At least, when running your project locally.

So, you would probably end up doing something like `export $(cat .env | xargs)`, and then running your process.

This approach has one major drawback: it updates the environment of your current shell, and it has a few implications:

- If you're working with several services, with various `dotenv` files, you may end up overwriting variables, or relying on variables defined by other services...
- ...worst-case scenario, you end up connecting to a production database when running a task that was supposed to run against a test database, and things go wild.
- You may leak tokens every time you call `env` in your terminal. Not ideal if you're streaming your content.

You can actually make sure your application loads its necessary environment variables without those inconveniences, either by using a Shell script, or a Makefile. Two very simple solutions compared to, say, setting up and maintaining SOPS[1].

So, basically by adding something like `server.sh` with the following:

```sh
#!/bin/sh
export $(cat .env | xargs)
# Running your server
```

Your env will be loaded inside the context of a new TTY (if I remember my UNIX lessons correctly).

It also works with Makefiles (and yeah, I hate the syntax, it's annoying and weird, but I always end up writing Makefiles):

```Makefile
include .env
export

server:
  # Running your server
```

And that's it. Also, make sure your variables are properly defined (such as `FOO=bar`, without quotes) because having additional quotes may cause issues (some loaders would escape quotes).

Not a revolutionary take, but better be safe (and clean) than sorry!

[1]: https://github.com/getsops/sops
