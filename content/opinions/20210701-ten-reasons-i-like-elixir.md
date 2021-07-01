+++
title = "Ten reasons I like Elixir"
date = 2021-07-01
[taxonomies]
tags = ["elixir"]
+++

## Context

### The Pipe operator
Elixir comes with a new operator that completely changes the flow of your code. It's so useful that many languages tend to make their own implementation of it.

Let's take an example. Instead of writing this:
```elixir
a = [1, 2, 3]
IO.inspect(a)
```

You can write this:
```
[1, 2, 3]
|> IO.inspect
```

`|>` allows you to redirect the result of a statement to the first parameter of a function call. Of course, it comes very handy and much more readable when you do a lot of function injections, like this:
```javascript
var x = 1;
console.log(b(a(x)));
```

```elixir
1
|> Kernel.+(4)
|> Kernel.*(2)
|> IO.inspect(limit: :infinity)
```

### Pattern matching is everywhere
`=` isn't a simple assignment operator, as in many mainstream languages. It's a match operator, meaning that you can write this:
```elixir
a = 1 # Assigns the value of 1 to the variable 'a'
```

But this works too:
```elixir
1 = a # Returns 1 if the left value matches the right value.
```

And this doesn't!
```elixir
2 = a
** (MatchError) no match of right hand side value: 1
```

You can of course match more complex data types such as maps (hash maps in Ruby or dictionaries in Python) and skip values you don't want to match on:
```elixir
%{id: 1, name: "Nathan"} = %{id: 1, name: "Nathan", created_at: ~U[2021-07-01 14:37:00.037796Z]}
# Or, if you want to check the presence of a key alone:
%{id: 1, name: "Nathan", created_at: _} = %{id: 1, name: "Nathan", created_at: ~U[2021-07-01 14:37:00.037796Z]}
# Returns the whole map in case of a match; we didn't check the value of :created_at there.
%{created_at: ~U[2021-07-01 14:37:00.037796Z], id: 1, name: "Nathan"}
```

But in my opinion, the biggest benefit of this is that you can use it in your function signatures (as guard clauses). Combined with function overloads and insightful error feedback, this gets really powerful and dries up all those imbricated if's and else's you may have written:
```elixir
defmodule Sample do
  # Defining an implementation for a string...
  def hello(name) when is_binary(name), do: IO.puts("Hello, #{name}")
  # ...for a map...
  def hello(%{name: name}), do: IO.puts("Hello, #{name}")
  # and a fallback for everything else...
  def hello(_), do: IO.puts("Hello world")
end
```

This brings in major advantages:
* In many cases, you don't have to check your parameters type and value anymore...
* You end up with numerous small overloads that are much more readable (if you stay reasonable)...
* Your code will crash explicitly if you missed a case and didn't implement a fallback:
```
defmodule Sample do
  def a(name) when is_binary(name), do: IO.puts(name)
end

> Sample.a(1)
** (FunctionClauseError) no function clause matching in Sample.a/1    
  The following arguments were given to Sample.a/1:

    # 1
    1
```
* Which makes iterating and implementing a true breeze!

A few months ago I implemented the A* pathfinding algorithm in Elixir, and wanted to demonstrate it step by step, and really appreciated the fact that I could replace the pseudo code (which was using a loop) with clear function overloads that individually indicated each step of the algorithm.

### The runtime is fast
### Docker images are super light
Your code is compiled to BEAM artifacts, and you don't bring half of the internet in your dependencies compared to many dynamic languages that use Just-In-Time compilation, meaning that you can use the builder pattern with Docker.

With that setup, applications I work on typically don't exceed 20MB for a Docker image (with the base image taking between 120MB and 170MB). The builder pattern is of course very helpful there. It's even lower than what I could obtain with Rust :-) (320MB for the base image, and 28MB each for a simple authentication server with Warp, Tokio and Mobc).

It may seem trivial, but having images that thin makes the whole building and shipping process that less painful.

Compared to that, Ruby images start at roughly 110MB and end up at two or three times that number over time, even without throwing in a "modern" frontend  and its own nifty 300MBs.

### It scales
### It's easy to debug
### Functional meets (some) strong typing
### The standard library is clean
### It has very good frameworks and libraries (especially Ecto)
### You get fast and reliable websockets out of the box

## Conclusion


