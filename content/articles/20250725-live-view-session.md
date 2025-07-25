+++
title = "Elixir: Having multiple Live Views on the same page"
description = "How to leverage Live Session for complex structures"
date = 2025-07-25
[taxonomies]
tags = ["tutorial", "elixir", "phoenix", "liveview"]
+++

## Context

In its early versions and up until v1.0, Phoenix LiveView has been designed to let you manage one LiveView at a time. But in a few cases, you'll need to be able to manage multiple Live Views, for either a complex dashboard, or even a navigation menu living on the side.

In my case, I had to implement a navigation bar in one of my projects, with a different class for the active element. Using a Live Component was not possible, because those can't be called from a regular (non-Live) template.

Although, since Live Views are GenServers, and therefore Processes, having one Process per user constantly running just for displaying a dynamic navigation bar isn't great. It would be much better to save those few kilobytes of RAM, and do the work with pure CSS and JS hooks, therefore offloading the logic to the client. But let's just consider we need two LiveViews sitting next to each other for our use case.

This is where [`live_session/3`][1] comes into play.

## Usage

`live_session/3` is a Router-specific "word" (in the Router DSL) that lets you define a handful of things:
* A `name` to identify it
* A `session` argument, in case you want to put a value in the connection (HTTP) Session
* A `root_layout` argument, in case you want to override it (it may already be specified in your pipeline)
* A `layout` argument, to specify a "partial view" that'll be rendered inside your root layout
* An `on_mount` callback to specify a list of functions to call in order to update the socket

## Example

This is how my code looks like:

```elixir
# router.ex
live_session :admin,
  on_mount: {SutoWeb.InitAssigns, :admin},
  layout: {SutoWeb.Layouts, :"live.admin"} do
  scope "/admin", SutoWeb.Admin do
    pipe_through :admin
    live "/", IndexLive
  end
end
```

```elixir
# init_assigns.ex
defmodule SutoWeb.InitAssigns do
  import Phoenix.Component

  def on_mount(:admin, _params, _session, socket) do
    current_page =
      case Atom.to_string(socket.view) do
        "Elixir.SutoWeb.Admin.AuthLive" <> _rest ->
          :auth

        "Elixir.SutoWeb.Admin.ChannelLive" <> _rest ->
          :channels

        "Elixir.SutoWeb.Admin.TimerLive" <> _rest ->
          :timers

        ...
      end

    {:cont, assign(socket, :current_page, current_page)}
  end
end
```

```elixir
# Partial layout
<div class="min-h-screen h-full flex flex-row bg-gray-300">
  <.live_component
    module={SutoWeb.Admin.NavLive}
    id="nav"
    class="p-5"
    current_page={assigns.current_page}
  />
  <main class="p-5 w-full h-screen overflow-auto">
    <.flash_group flash={@flash} />
    {@inner_content}
  </main>
</div>
```

And the `NavLive` module here is just a navigation bar built with [Petal Framework][2], defining list items and picking the right Tailwind class for the active item.

That's it :) Please keep in mind that using a Live Session for something that could be offloaded to the client (with JavaScript and hooks) isn't great, but this gives you an idea on what structure to use, in case you're building a complex trading dashboard, and you absolutely need to have separate LiveViews on the same page, for concurrency reasons or resilience.

[1]: https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.Router.html#live_session/3
[2]: https://petal.build/
