+++
title = "Elixir: Using Environment Variables"
description = "A short guide about dealing with environment variables in your Elixir project"
date = 2021-09-16
[taxonomies]
tags = ["tutorial", "elixir"]
+++

## Context

An environment variable is a widespread programming concept that refers to a value coming from the system, being read by an application at runtime. Elixir can be a bit surprising on that aspect for beginners.

This is one way of accessing an environment variable:

```
> HELLO=world iex
iex(1)> System.get_env("HELLO")
"world"
```

And the same call would work in your application source code.

However, you may want to avoid scattering those calls in every corner, and use a config file instead to centralize your settings and your default values.

Mix doesn't generate config files by default, so you'd have to create one of those, like this:

```sh
mix new foo
cd foo
mkdir config
touch config/config.exs
```

And edit your `config/config.exs` file, like this:

```elixir
import Config

config :foo, hello: System.get_env("HELLO")
```

And lastly, modify `lib/foo.ex` like this, to actually use the key-value pair we defined:

```elixir
module Foo do
  # ...
  def hello do
    Application.get_env(:foo, :hello, "default")
  end
end
```

Now, we want to produce a build, but let's define our environment variable just before we do that:

```sh
export HELLO=foo
MIX_ENV=prod mix release
```

Now let's run an interactive terminal to our build, and let's override that env variable along the way:

```sh
HELLO=bar ./_build/prod/rel/foo/bin/foo start_iex
```

There, calling `Foo.hello` would return "foo", not "bar".

You can easily get surprises when releasing your first Elixir app, because this is not something you can reliably reproduce with `iex -S mix` locally.

## What happened

Well basically, `exs` files are script files: they're used at build or test times, and aren't present in your final build. When building your release, Mix interpreted `System.get_env` directly and hardcoded the value.

## Solutions

One exception to that is the Elixir 1.11 addition `config/runtime.exs` file, meant to be "compiled" at runtime.

Of course, you could argue that using `System.get_env` directly in your source code would work, but I would say this wouldn't be a great idea ;-)

There's an alternative to `config/runtime.exs` though, [which is the `env` library][0]. It lets you define tuples in your config files, and a getter similar to `Application.get_env`:

```elixir
# In your config files:
import Config

config :test, hello: {:system, "HELLO", "world"}

# In your codebase:
Env.fetch(:test, :hello)
```

_Et voilà !_ Hope this helps.

If you want to know more about Elixir builds and releases, as always, [the official documentation is a great place to start][1].

## 2025 Update

I wanted to make an update a while ago to state one thing: you probably don't need a library such as `env` in your application. You just have to remember the following statements:
- Your configuration is split between environments (`config/{dev,test,prod}.exs`) which is built at compilation time
- You have to make sure your environment variables are defined at compilation time if you make calls to `System.get_env`, otherwise, your config would contain empty settings. You can check [this article][3] for the most optimal way to do that locally.
- There's one exception to that: `config/runtime.exs` is *always* evaluated at runtime, and not only in production. This is where you can reliably call `System.get_env`. Just be cautious and insert production configuration inside the right "block" in there, because it's also used for dev and test.

There's actually another exception you may come across in older Elixir projects, which is `config/releases.exs`, used until Elixir v1.11.0.

Finally, checking both [Elixir][2] and [Mix][4] documentations for your versions is always a good idea.

[0]: https://hex.pm/packages/env
[1]: https://hexdocs.pm/mix/1.12/Mix.Tasks.Release.html
[2]: https://hexdocs.pm/elixir/config-and-releases.html
[3]: /articles/20250227-loading-env-without-leaks
[4]: https://hexdocs.pm/mix/1.18.4/Mix.Tasks.Release.html