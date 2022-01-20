+++
title = "Elixir: Getting started in 2022"
description = "A curated list of everything a beginner needs to become a pro with Elixir"
date = 2022-01-15
[taxonomies]
tags = ["elixir"]
+++

## What's Elixir, and why should I learn it?
Elixir is a dynamic, functional programming language that relies on the versatility and robustness of Erlang/OTP (a platform built by Ericsson engineers in the late 80's to help building low-latency, distributed and fault-tolerant systems), and the expressivity and clarity of languages such as Ruby.

I've been learning, writting and running Elixir applications in production since roughly 2019. Elixir itself would probably deserves a dedicated article as to why it's great (but not perfect), but since you're here, on this confidential page, I'll just list my top five highlights that make the language great, in my opinion:

* It's *fast* in a lot of areas, runtime for a start, but not only: tests run almost instantly. If you come from a Ruby background (and especially Rails...), this might reconciliate you with TDD. Also, Docker images are ridiculously small (we're talking about a 13MB image, both for a boilerplate and a medium-sized application), especially compared to your 300MB NodeJS or 150MB Rails app, and applications are deployed very quickly.

* Elixir is a *functional* language. It might not be as much functional as some developers would like it to be (and I suspect most developers advocating for a specific language have their own definition of "functional", anyway) but it has a lot of powerful features.
Some languages (such as Rust) share the immutable data paradigm and a pattern matching operator, but Elixir goes a bit further on the latter, allowing you to use pattern matching combined with function overloads. And this is huge. Consider this Ruby message processor, and how it can be refactored in Elixir:

```ruby
# This is some Ruby code.
class Message
  def process(data)
    case data.type do
      when "notification"
        # Do something with data.subject
        # ...
      when "business-object-update"
        # Do something with data.subject (id and type)
        # ...
      else
        Logger.error("Unsupported type for #{data.inspect}")
        # ...
    end
  end
end
```

```elixir
# And this is some Elixir code.
defmodule Message do
  require Logger

  def process(%{type: "notification", subject: message}) do
    # ...
  end

  def process(%{type: "business-object-update", subject: %{id: id, type: type}}) do
    # ...
  end

  def process(data) do
    Logger.error("Unsupported type for #{inspect(data)}")
    # ...
  end
end
```

You can of course leverage this in a lot of situations, but it basically allows you to split your logic into separate definitions, that usually gets less clutter over time. It also makes writing recursive functions a lot clearer.

Also, a typo usually means a crash in the Ruby version. A typo in the Elixir variant just won't match (and in many cases, won't even compile at all) and the fallback will be used instead.

* Elixir also has the pipe operator, which allows you to redirect the result of a statement toward the next one, as its first argument. So instead of writing:
```elixir
number = 1
multiply = fn x -> x * 2 end
IO.inspect(multiply(number))
```

You can just write:
```elixir
number = 1
multiply = fn x -> x * 2 end
number
|> multiply()
|> IO.inspect
```

The example here is simplistic, but it gets very handy when coupled with pattern matching, situations where you have to build a query with Ecto... It's very powerful, even mindblowing, and a lot of languages try to implement their own version of the pipe operator.

* Erlang/OTP is *insanely* powerful, and the fault-tolerancy is no joke. It gets a bit of time and a lot of practice to master the supervision tree and all the debugging tools that Erlang comes with, but then it lets you build fast, reliable apps with simpler stacks, distributed nodes and realtime capabilities handling an insane traffic. Say goodbye to that Sidekiq or Celery worker. You get everything to run synchronous and asynchronous tasks immediately and can do it on the same, single instance that handles your HTTP requests.

* Elixir is *readable*. There are exceptions, with some packages relying a lot on macros (which I've been hating since 2015), but in the vast majority of libraries, you can just go and check the implementation yourself, there's no ouf-of-control metaprogramming bullshit, no over-engineered module bloats. Also, since it's functional, IDE tools (such as Dialyzer) can usually do a very good job at listing all occurrences of a function call, or finding the definition.

From my humble point of view, I don't think Elixir is perfect (ExUnit is a bit frustrating compared to RSpec for example, and sometimes I really want Rust enums...), but it's easily one of the languages I love the most to write in, with the best frustration/productivity ratio.

I wrote that article to help beginners getting started with Elixir and its ecosystem. I'll update that page as best as I can. Feedback would be greatly appreciated!

## Learning the basics
[The official "Getting Started" Elixir guide][0] is a great place to start.

Alternatively, if you prefer video content, [Derek Banas][1] regularly publishes great content on his youtube channel and does a fantastic job at introducing languages and frameworks. His [video on Elixir][2] is an excellent starting point if you already have experience as a programmer and want to grasp the syntax very quickly.

{{ youtube(id="pBNOavRoNL0", class="video-embed") }}

This is the path I chose since I prefer to get started quickly and improve over time.

[ElixirCasts][18] is the Elixir equivalent of the awesome RailsCast from Ryan Bates. High quality content there.

## Getting your hands dirty
You can just go and [try Elixir online][8].

Elixir also has [interactive notebooks][7] with LiveBook!

You can also install Elixir on your computer (that's a requirement if you want to use LiveBook locally and without Docker). My preference goes to [ASDF][9]. Once installed, you can get the [Erlang plugin][10] and the [Elixir plugin][11], and install one version of Elixir built for the Erlang OTP version you installed. For example:
```sh
asdf install erlang 24.1
asdf install elixir 1.13.0-otp-24
```

The Elixir compiler produces artifacts that'll run on BEAM, the current Erlang Virtual Machine. That's why you need to install both.

## Going further with Elixir and OTP
The Pragmatic Studio has a great online course [focusing on Elixir & OTP][3]. If you want to build a strong knowledge about the internal workings of Elixir and Erlang, this is a really strong source. I have yet to finish the last third of it but have already saved up a lot of time and frustration compared to people learning on the fly, and being scared to build anything that goes beyond simple CRUD applications.

[The Pragmatic Bookshelf][4] is also regularly quoted as providing great material if you prefer a more traditional way of learning.

## Joining the community
Don't hesitate to join [the official Slack][5] and say hi!

The [Elixir Forum][6] is also worth mentioning. It's usually a very good way to share issues and solutions.

If you're on Twitter, it's usually a good idea to follow the official [Elixir account][17] there.

## Notable technologies
* Check out [Phoenix][12] for a fully-featured Web framework, including Ecto, a fantastic ORM.
* Keep an eye on [LiveView][13], the tech behind LiveBook. It's basically a Rails + Turbolinks alternative, but with working WebSockets.
* Consider [RabbitMQ][15], one of the most widely deployed and trusted message broker, for your services oriented architecture.
* If you're into data science and machine learning, you'll be interested by [Nx][16] :-)

[0]: https://elixir-lang.org/getting-started/introduction.html
[1]: https://www.youtube.com/channel/UCwRXb5dUK4cvsHbx-rGzSgw
[2]: https://www.youtube.com/watch?v=pBNOavRoNL0
[3]: https://pragmaticstudio.com/elixir#buy
[4]: https://pragprog.com/
[5]: https://elixir-lang.slack.com/
[6]: https://elixirforum.com/
[7]: https://livebook.dev/
[8]: https://try-elixir.herokuapp.com/
[9]: https://asdf-vm.com/
[10]: https://github.com/asdf-vm/asdf-erlang
[11]: https://github.com/asdf-vm/asdf-elixir
[12]: https://www.phoenixframework.org/
[13]: https://dockyard.com/blog/2018/12/12/phoenix-liveview-interactive-real-time-apps-no-need-to-write-javascript
[14]: https://www.phoenixframework.org/blog/build-a-real-time-twitter-clone-in-15-minutes-with-live-view-and-phoenix-1-5
[15]: https://www.rabbitmq.com/
[16]: https://github.com/elixir-nx
[17]: https://twitter.com/elixirlang
[18]: https://elixircasts.io/
