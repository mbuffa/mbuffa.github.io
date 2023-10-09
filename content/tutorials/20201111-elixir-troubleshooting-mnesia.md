+++
title = "Elixir: Troubleshooting Mnesia"
description = "An Elixir tutorial to use Erlang's :mnesia in your cluster."
date = 2020-11-11
[taxonomies]
tags = ["elixir", "erlang"]
+++

## Context
Mnesia is a powerful DBMS implemented in Erlang which you can use in your Elixir application.

Why would you want to do that?
* It can span over multiple nodes in your cluster, providing redundancy and recovery mechanisms.
* It prevents you from adding an external dependency like Redis, PostgreSQL, or whatever.
* It provides all the features you need from a solid DBMS like transactions, locks, indices, dumps to disk, and a consistent data structure.

After looking at and evaluating alternatives when working on a project at Pandascore, I finally decided to give a shot at Mnesia for storing an internal state. It took me a few hours to set it up correctly, but I ran into several issues that may drive anyone nearing an end of sprint crazy, so here's a few tips for it :-)

One disclaimer though: this project is in production (\o/), but due to other priorities, I'm not really monitoring it or improving the design, and thus learning more about Mnesia.

So this is pretty much a beginner to beginner feedback. Please take it with a pinch of salt.

## Some useful links
Since I'm pretty much writing an addendum, you'll find more exhaustive information with the following articles and resources. You can read them afterwards if you prefer, and go back to this article if you encounter any issue.

First, [this excellent article from Welcome to the Jungle][0] gave me a good overview on how to setup Mnesia in a cluster.

Two more links are mentioned at the end of this article, but I'll paste them here too. [Elixir School has a good walkthrough][1] from begin to end mostly, and of course, [the Erlang documentation][2] is a gold mine, though it can be a bit rough to read if you're well-versed in Elixir but not Erlang.

You can also check [my article on deploying an Elixir cluster on Kubernetes][3] since I give a few details on how to set up a simple local cluster. I'll do it more quickly here anyway.

## Let's create a sample project
Let's create a simple project to try out Mnesia locally. We'll need to run a small cluster, so we'll throw in one specific library.

```
$ mix new clustertest
$ cd clustertest
```

And let's head out to `mix.exs` to add `libcluster`:
```
# In mix.exs
defp deps do
  [
    {:libcluster, "~> 3.2.1"},
  ]
end
```

And let's define a very simple Supervisor. This will get our ClusterSupervisor
started, with a simple configuration for our local experiments!

```
# In mix.exs:
def application do
  [
    mod: {Clustertest.Application, []},
    extra_applications: [:logger]
  ]
end

# In lib/clustertest/application.ex
defmodule Clustertest.Application do
  use Application

  def start(_type, _args) do
    topologies = [
      epmd_example: [
        strategy: Cluster.Strategy.Epmd,
        config: [
          hosts: [:"a@127.0.0.1", :"b@127.0.0.1"]
        ]
      ]
    ]

    [
      {Cluster.Supervisor, [topologies, [name: Clustertest.ClusterSupervisor]]}
    ]
    |> Supervisor.start_link(strategy: :one_for_one)
  end
end
```

This will get you started with a small cluster of two nodes. `Epmd` is
perfectly fit for our example here, since we just have to specify a few hosts.

Now, let's open two shells and start two instances:
```
# In one shell
iex --name a@127.0.0.1 -S mix

# In another one
iex --name b@127.0.0.1 -S mix
```

Now, running `Node.list()` in each REPL should give you exactly one atom:
```
> [:"b@127.0.0.1"]

> [:"a@127.0.0.1"]
```

## Initializing Mnesia
Now, let's start actually using Mnesia. We'll pretend we're running a small wildlife protection office taking care of local racoons.

Also, for the sake of simplicity, we'll add it directly to the children of our app. There's no need for complexity for hello world code :)
```
# In lib/clustertest/application.ex
defmodule Clustertest.Application do
  use Application

  def start(_type, _args) do
    topologies = [...]

    [
      {Cluster.Supervisor, [topologies, [name: Clustertest.ClusterSupervisor]]},

      {Clustertest.Store.Racoon, []},
    ]
    |> Supervisor.start_link(strategy: :one_for_one)
  end
end

# In lib/clustertest/store/racoon.ex
defmodule Clustertest.Store.Racoon do
  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, %{}, opts)
  end

  def init(state) do
    setup_store()

    {:ok, state}
  end

  defp setup_store() do
    IO.puts("Setting up store...")

    :ok = ensure_schema_exists()
    :ok = :mnesia.start()
    :ok = ensure_table_exists()

    IO.puts("...Store set up!")
  end

  defp ensure_schema_exists() do
    case :mnesia.create_schema([node()]) do
      {:error, {_node, {:already_exists, __node}}} ->
        :ok

      :ok -> :ok
    end
  end

  defp ensure_table_exists() do
    :mnesia.create_table(
      Racoon,
      [
        attributes: [
          :id,
          :name,
          :caretaker_id
        ]
      ]
    )
    |> case do
      {:atomic, :ok} ->
        :ok
      {:aborted, {:already_exists, Racoon}} ->
        :ok
    end

    :ok = :mnesia.wait_for_tables([Racoon], 5000)
  end

end
```

There are a few important things to note here.

First, you *need* to create a schema *before* starting Mnesia. This is really important. Try switching the two lines to see what happens.

Then, you're free to create your table. Both schema and table can be already created when you run your app, since Mnesia keeps RAM and disk copies, depending on how you configure it. By the way, you should have noticed there are now two new folders in your project directory:
```
$ ls
Mnesia.a@127.0.0.1
Mnesia.b@127.0.0.1
```

Hmm, let's see if Mnesia is properly configured. Type this in a terminal:
```
$ :mnesia.info()
```

This will be your best friend for debugging Mnesia :)

```
---> Processes holding locks <---
---> Processes waiting for locks <---
---> Participant transactions <---
---> Coordinator transactions <---
---> Uncertain transactions <---
---> Active tables <---
Elixir.Racoon  : with 0        records occupying 305      words of mem
schema         : with 2        records occupying 535      words of mem
===> System info in version "4.17", debug level = none <===
opt_disc. Directory "/home/makks/code/mbuffa/clustertest/Mnesia.a@127.0.0.1" is used.
use fallback at restart = false
running db nodes   = ['a@127.0.0.1']
stopped db nodes   = []
master node tables = []
remote             = []
ram_copies         = ['Elixir.Racoon']
disc_copies        = [schema]
disc_only_copies   = []
[{'a@127.0.0.1',disc_copies}] = [schema]
[{'a@127.0.0.1',ram_copies}] = ['Elixir.Racoon']
3 transactions committed, 0 aborted, 0 restarted, 2 logged to disc
0 held locks, 0 in queue; 0 local transactions, 0 remote
0 transactions waits for other nodes: []
:ok
```

Hmm, looking at `running db nodes`, we're only running two Mnesia nodes independently. We want to connect them, but we have to do it ourselves when new nodes are connected.

Let's go back to our Store and add a bit of code:

* We want to be notified when new nodes connect...
```
defmodule Clustertest.Store.Racoon do
  use GenServer

  [...]

  def init(state) do
    # Get notified when new nodes are connected.
    :ok = :net_kernel.monitor_nodes(true)

    setup_store()

    {:ok, state}
  end

  [...]
end
```

* ...And we want to configure Mnesia to use extra nodes, create a table copy on the other node, and remove the other node when connection is lost.
```
defmodule Clustertest.Store.Racoon do
  [...]

  def handle_info({:nodeup, node}, state) do
    IO.puts("Node connected: #{inspect node}")

    :ok = connect_mnesia_to_cluster()

    {:noreply, state}
  end

  def handle_info({:nodedown, node}, state) do
    IO.puts("Node disconnected: #{inspect node}")

    update_mnesia_nodes()

    {:noreply, state}
  end

  defp connect_mnesia_to_cluster() do
    :ok = :mnesia.start()

    {:ok, [_|_] = nodes} = :mnesia.change_config(:extra_db_nodes, Node.list())

    IO.puts("Extra db nodes: #{ inspect nodes }")

    :ok = ensure_table_exists()
    :mnesia.change_table_copy_type(:schema, node(), :disc_copies)
    :ok = ensure_table_copy_exists()

    IO.puts("Successfully connected Mnesia to the cluster!")

    :ok
  end

  defp update_mnesia_nodes do
    nodes = Node.list()
    IO.puts("Updating Mnesia nodes with #{inspect nodes}")
    :mnesia.change_config(:extra_db_nodes, nodes)
  end

  defp ensure_schema_exists() do
    [...]
  end

  defp ensure_table_exists() do
    [...]
  end

  defp ensure_table_copy_exists() do
    case :mnesia.add_table_copy(Racoon, node(), :disc_copies) do
      {:atomic, :ok} -> :ok
      {:aborted, {:already_exists, Racoon, _node}} -> :ok
    end
  end
end
```

Now, restarting our two nodes should raise an error:
```
17:20:34.541 [error] GenServer #PID<0.213.0> terminating
** (MatchError) no match of right hand side value: {:ok, []}
    (clustertest 0.1.0) lib/clustertest/store/racoon.ex:46: Clustertest.Store.Racoon.connect_mnesia_to_cluster/0
    (clustertest 0.1.0) lib/clustertest/store/racoon.ex:30: Clustertest.Store.Racoon.handle_info/2
    (stdlib 3.13) gen_server.erl:680: :gen_server.try_dispatch/4
    (stdlib 3.13) gen_server.erl:756: :gen_server.handle_msg/6
    (stdlib 3.13) proc_lib.erl:226: :proc_lib.init_p_do_apply/3
Last message: {:nodeup, :"b@127.0.0.1"}
State: %{}
```

Why is `:mnesia.change_config(:extra_db_nodes, Node.list())` returning `:ok` with an empty array?

Well, you can't really guess, and silent errors is why Mnesia can be difficult to work with for the first time.

In fact, Mnesia requires that you create an identical schema on each of your nodes, sharing the same cookie. By calling `setup_store()` and its `:mnesia.create_schema()`, you're creating two conflicting schemas Mnesia can't resolve.

Let's remove `setup_store()` completely (and `ensure_schema_exists()` too). If we need to be able to deploy single nodes (locally for example) we can still define an environment variable to decide what to do. But this is off-topic.

Also, remember those two folders that popped up in your directory? Remove those folders. Those may contain conflicting schemas.

Now, let's restart our two REPLs.
```
17:35:48.049 [error] GenServer #PID<0.213.0> terminating
** (MatchError) no match of right hand side value: {:ok, []}
    (clustertest 0.1.0) lib/clustertest/store/racoon.ex:34: Clustertest.Store.Racoon.connect_mnesia_to_cluster/0
    (clustertest 0.1.0) lib/clustertest/store/racoon.ex:18: Clustertest.Store.Racoon.handle_info/2
    (stdlib 3.13) gen_server.erl:680: :gen_server.try_dispatch/4
    (stdlib 3.13) gen_server.erl:756: :gen_server.handle_msg/6
    (stdlib 3.13) proc_lib.erl:226: :proc_lib.init_p_do_apply/3
Last message: {:nodeup, :"b@127.0.0.1"}
State: %{}
```

Well, you can't guess either, but Mnesia must be started as an application. Surprisingly enough, trying to use `:mnesia` functions wouldn't raise any errors.

So let's head to our manifest and add `:mnesia` in a familiar place:
```
# In mix.exs
def application do
  [
    mod: {Clustertest.Application, []},
    extra_applications: [:logger, :mnesia]
  ]
end
```

Now let's check...
```
---> Processes holding locks <---
---> Processes waiting for locks <---
---> Participant transactions <---
---> Coordinator transactions <---
---> Uncertain transactions <---
---> Active tables <---
schema         : with 2        records occupying 554      words of mem
===> System info in version "4.17", debug level = none <===
opt_disc. Directory "/home/makks/code/mbuffa/clustertest/Mnesia.a@127.0.0.1" is NOT used.
use fallback at restart = false
running db nodes   = ['b@127.0.0.1','a@127.0.0.1']
stopped db nodes   = []
master node tables = []
remote             = ['Elixir.Racoon']
ram_copies         = [schema]
disc_copies        = []
disc_only_copies   = []
[{'a@127.0.0.1',ram_copies},{'b@127.0.0.1',disc_copies}] = [schema]
[{'b@127.0.0.1',ram_copies}] = ['Elixir.Racoon']
2 transactions committed, 0 aborted, 0 restarted, 0 logged to disc
0 held locks, 0 in queue; 0 local transactions, 0 remote
0 transactions waits for other nodes: []
```

![](https://media.giphy.com/media/4xpB3eE00FfBm/giphy.gif "hooray")

See how `opt_disc` and `running db nodes` changed. But we have no data yet.

## Inserting data
We'll add some code and make some changes so that we'll use a struct defined in `Types.Racoon`. The naming in my example isn't great, but basically, we're just adding serialization/deserialization functions to manipulate structs in our codebase, while Mnesia stores tuples.

So we'll add two functions, `list()` and `create()`, and do a few changes on the table name.

```
defmodule Clustertest.Store.Racoon do
  [...]

  defmodule Types.Racoon do
    defstruct [
      :id,
      :name,
      caretaker_id: nil
    ]

    def decode({__MODULE__, id, name, caretaker_id}) do
      %__MODULE__{
        id: id,
        name: name,
        caretaker_id: caretaker_id
      }
    end

    def encode(%__MODULE__{
      id: id,
      name: name,
      caretaker_id: caretaker_id
    }) do
      {__MODULE__, id, name, caretaker_id}
    end
  end

  [...]

  def list() do
    {:atomic, list} = :mnesia.transaction(fn ->
      :mnesia.match_object({Types.Racoon, :_, :_, :_})
    end)

    list |> Enum.map(fn x -> Types.Racoon.decode(x) end)
  end

  def create(%Types.Racoon{ id: id } = state) when is_integer(id) do
    IO.puts("Inserting #{inspect state}")

    {:atomic, reason} = :mnesia.transaction(fn ->
      case :mnesia.read(Types.Racoon, id, :write) do
        [] ->
          Types.Racoon.encode(state) |> :mnesia.write()
        _ ->
          :record_exists
      end
    end)

    reason
  end

  [...]

  defp ensure_table_exists() do
    :mnesia.create_table(
      Types.Racoon,
      [
        attributes: [
          :id,
          :name,
          :caretaker_id
        ]
      ]
    )
    |> case do
      {:atomic, :ok} ->
        :ok
      {:aborted, {:already_exists, Types.Racoon}} ->
        :ok
    end

    :ok = :mnesia.wait_for_tables([Types.Racoon], 5000)
  end

  defp ensure_table_copy_exists() do
    case :mnesia.add_table_copy(Types.Racoon, node(), :disc_copies) do
      {:atomic, :ok} -> :ok
      {:aborted, {:already_exists, Types.Racoon, _node}} -> :ok
    end
  end
```

Now let's test a few examples, after a REPL reset.
```
# In your first shell:
iex(a@127.0.0.1)3> Clustertest.Store.Racoon.list()
[]
iex(a@127.0.0.1)4> Clustertest.Store.Racoon.create(%Clustertest.Store.Racoon.Types.Racoon{ id: 1, name: "Ricky", caretaker_id: nil })
Inserting %Clustertest.Store.Racoon.Types.Racoon{caretaker_id: nil, id: 1, name: "Ricky"}
:ok

# In your second shell:
iex(b@127.0.0.1)4> Clustertest.Store.Racoon.list()
[
  %Clustertest.Store.Racoon.Types.Racoon{
    caretaker_id: nil,
    id: 1,
    name: "Ricky"
  }
]
```

The `update`, `read`, and `delete` functions are quite straighforward. You can implement them yourself, but I'm adding those as a reference.
```
defmodule Clustertest.Store.Racoon do
  [...]

  def update(%Types.Racoon{ id: id } = new_state) when is_integer(id) do
    IO.puts("Updating #{inspect new_state}")

    {:atomic, reason} = :mnesia.transaction(fn ->
      [{Types.Racoon, ^id, _, _,}] = :mnesia.read(Types.Racoon, id, :write)

      Types.Racoon.encode(new_state) |> :mnesia.write()
    end)

    reason
  end

  def read(id) when is_integer(id) do
    IO.puts("Returning #{id}")

    {:atomic, result} = :mnesia.transaction(fn ->
      :mnesia.read(Types.Racoon, id, :read)
    end)

    case result do
      [] -> nil
      list -> list |> List.first() |> Types.Racoon.decode()
    end
  end

  def delete(id) when is_integer(id) do
    IO.puts("Deleting #{id}")

    {:atomic, :ok} = :mnesia.transaction(fn ->
      :ok = :mnesia.delete(Types.Racoon, id, :write)
    end)
    :ok
  end

  [...]
end
```

You can play around with this :) Note that creating data on one node, and creating the identical data on another node doesn't raise any issue, but do not create duplicates either.

There's one issue remaining though: closing both REPLs clear the table. This is because we forgot to specify one option when calling `:mnesia.create_table`!
```
:mnesia.create_table(
  Types.Racoon,
  [
    attributes: [
      :id,
      :name,
      :caretaker_id
    ],
    disc_copies: [Node.self()]
  ]
)
```

Now we're good, and `:mnesia.info()` doesn't show an empty `disc_copies` anymore.

## A few important notes for releases...
...and solving the "bad cookie" issue.

Keep in mind that we've been using `iex` all along and that running a compiled application will raise a few differences.

Remember the snippet I used for adding `:mnesia` to our running application?
```
# In mix.exs
def application do
  [
    mod: {Clustertest.Application, []},
    extra_applications: [:logger, :mnesia]
  ]
end
```

![](https://media.giphy.com/media/11CCn8sSFSm2kg/giphy.gif "I lied.")

Well, it might cause you some trouble once you compile your release with `mix release` and your node starts.

Thing is, adding libraries to `extra_applications` would start them automatically before your application does, so we have to specify
that we only want to reference it in our release, to avoid :mnesia creating a schema and starting automatically.

```
# In mix.exs
def application do
  [
    mod: {Clustertest.Application, []},
    extra_applications: [:logger],
    included_applications: [:mnesia]
  ]
end
```

Thing is, I also had to revert my changes on `create_table` and remove the `disc_copies` option.
```
:mnesia.create_table(
  Types.Racoon,
  [
    attributes: [
      :id,
      :name,
      :caretaker_id
    ]
  ]
)
```

Now, `:mnesia.info()` will properly display a populated `disc_copies` option.

I do not know why those differences between `iex` and compiled code exist. I may be doing something wrong, so please feel free to open an issue on the [repository][5] if you find why!

## Conclusion
I hope this was neither too tedious or frightening regarding the usage of Mnesia in your project. I thought the "crash course" format to be interesting in this case (ie. amending snippets), because it helps to have beaten that path when things go wrong.

I didn't mention the issue of network partitioning and a possible way to solve it, but this is more related to your cluster configuration. Essentially, network failure may happen inside your cluster, and reconnecting nodes wouldn't know how to handle this, since we're not using a master-replica strategy. I haven't read much about this, but one possible solution would be to pass the cluster size as an environment variable to all nodes, and check the `Node.list()` result when a `:nodedown` message is received. Afterwards, a simple calculation should be enough to determine if your node is isolated or in a dominant group, allowing you to push the self-destruct red button with, for example, a "liveness" GenServer exposed to your orchestrator, returning `HTTP 200 Ok` responses codes until isolation is detected.

Note that there's also the [Mnesiac][6] library, which is an Elixir layer on top of Mnesia. I prefer using low-level libraries directly, at least for learning, but it might be a good fit for production though.

Last, but not least, I [created a repository][5] with a small and clear commit history, in case you want to tinker with it.

*Et voilà.*

[0]: https://www.welcometothejungle.com/fr/articles/redis-mnesia-distributed-database
[1]: https://elixirschool.com/en/lessons/specifics/mnesia
[2]: http://erlang.org/doc/man/mnesia.html
[3]: /tips/20201022-elixir-clustering-on-kubernetes/
[4]: https://elixirforum.com/t/documenting-the-use-of-included-applications/1673
[5]: https://github.com/mbuffa/elixir-mnesia-example
[6]: https://github.com/beardedeagle/mnesiac
