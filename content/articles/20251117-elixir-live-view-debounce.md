+++
title = "Elixir: Rate limit your LiveView forms"
description = "Beware of back-and-forths in your Live Views"
date = 2025-11-17
[taxonomies]
tags = ["tip", "elixir", "phoenix", "liveview"]
+++

## Context
Not so long ago, on a Friday morning, while I was peacefully making some coffee and preparing for a relaxed day after weeks of crunch, I received a strange message that would eventually transform this day into a totally different experience.

The feedback was about a specific Live View form that was behaving weirdly, and the phenomenon was supposedly new: using the form was causing some data to be lost, multiple selected items would be erased, and so on.

I immediately thought about a bad connectivity issue but couldn't reproduce the issue on our test environment, even with the integrated browser throttling tools.

But I eventually made it. With a VPN, connected to servers far away from my servers' location.

## Issue
Simply put, the culprit was the form itself, and how it was handling validation: on each key stroke. That was causing issues when the user experienced some connection latency (even with a fast connection, because of the delay that may happen between HTTP calls), and so LiveView's frontend part was overloading the backend, causing various behaviors, such as a flashing UI, unresponsive widgets, or even lost data.

## Solution
I remembered encountering a similar situation with React, and this is honestly Frontend Development 101: you have to throttle or debounce your validations, and you don't need to execute them while the user isn't done typing their name or their phone number anyway.

Since its early days, [LiveView provides an easy way to do that][0]. `phx-debounce` allows passing an integer value representing milliseconds, or "blur", so that you can decide if you'll trigger validation once the input loses focus, or after a varying period of time. `phx-throttle` does the same thing, except it emits an event on the first change before the rate limit.

So, nothing revolutionary here, but you'll probably want to check and optimize your LiveViews (and your components, and [libraries][1]) *before* it gets used by thousands of people.

Some days just make you feel you're the cop being shot two days before retirement.

[0]: https://hexdocs.pm/phoenix_live_view/1.1.17/bindings.html#rate-limiting-events-with-debounce-and-throttle
[1]: https://github.com/nkezhaya/live_phone/pull/169
