+++
title = "Elixir: Using Environment Variables"
description = "A short guide about dealing with environment variables in your Elixir project"
date = 2021-09-16
[taxonomies]
tags = ["elixir"]
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

Newer versions of Mix no longer generate config files by default, so you'd have to create one of those, like this:
```sh
mix new test
cd test
mkdir config
touch config/config.exs
```

And edit your `config/config.exs` file, like this:
```elixir
import Config

config :test, hello: System.get_env("HELLO")
```

And lastly, modify `lib/test.ex` like this, to actually use the key-value pair we defined:
```elixir
module Test do
  # ...
  def hello do
    Application.get_env(:test, :hello, "default")
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
HELLO=bar ./_build/prod/rel/test/bin/test start_iex
```

There, calling `Test.hello` would return "foo", not "bar".

You can easily get surprises when releasing your first Elixir app, because this is not something you can reproduce with `iex -S mix`.

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

*Et voilà !* Hope this helps.

If you want to know more about Elixir builds and releases, as always, [the official documentation is a great place to start][1].

[0]: https://hex.pm/packages/env
[1]: https://hexdocs.pm/mix/1.12/Mix.Tasks.Release.html
