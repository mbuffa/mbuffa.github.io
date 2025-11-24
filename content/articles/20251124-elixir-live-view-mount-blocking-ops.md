+++
title = "Elixir: Why your LiveViews `mount/3` shall be minimal and fast"
description = "You would regret not doing so"
date = 2025-11-24
[taxonomies]
tags = ["tip", "elixir", "phoenix", "liveview"]
+++

## Context
There's one thing that you may do when developping your first LiveView apps (or developping applications in the early days of LV) that may have important consequences in production, or even during development, which may also become a bit hard to track down.

The [LiveView documentation][0] is excellent and easy to read, and there's a good paragraph on async operations. But it may not stress out enough how having blocking operations in your `mount/3` callback may be a very terrible idea.

## Your page lifecycle
`mount/3` is called two times: on your first page render, and another time when your socket gets connected, initially. Also, if your frontend disconnects and reconnects, `mount/3` will be called again.

So, let's say you have a typical CRUD app, with a query that would fetch records on the index action, and doing that query in `mount`. Almost sounds harmless, right?

But it would actually have a couple of effects.

After a successful deployment, with a substantial amount of users connected, their LiveViews would try to reconnect to the newly deployed backends, may take a while to reconnect, freeze the UI meanwhile, or even end up in a timeout state. Also, navigations between pages would be much slower and probably noticeable.

Also, in development, you would eventually trigger the code reloader, that would in turn kill and reset your current LiveView(s). potentially depleting your Ecto pool, and get a frozen UI that would eventually timeout, with a mysterious error in the JS logs (`Unable to join (timeout)`). It doesn't take more than a few tabs open or several active LiveViews to trigger this situation with the default setup of 10 connections.

Bottom line is: that particular callback should always be minimal, and you should always try to do things asynchronously as much as psosible. `start_async/3` and `assign_async/3` are excellent ways to help you do that. And to be fair, this is not a nice to have. It should be mandatory for all production apps and as such, treated as a high priority flaw to address.

[0]: https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.html
