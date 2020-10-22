+++
title = "Elixir: Clustering on Kubernetes"
date = 2020-10-21
[taxonomies]
tags = ["elixir", "k8s"]
+++

## Context
When developing Elixir applications, you may want to create a cluster of Erlang nodes at some point, for example, to provide redundancy, high availability,or to share a global state on the cluster (with Mnesia, for example) without hitting an outside DBMS.

This can be easily achieved with `libcluster`. As you can see [in the docs][0], it supports multiple strategies.

I'll assume you want to deploy to a Kubernetes cluster, and I'll be covering this strategy only (`Cluster.Strategy.Kubernetes`) for simplicity sake, but you may find some bits interesting even if that doesn't apply to your case. I'll also assume that you already have a working basic Kubernetes deployment setup.

We'll deploy a `cluster` of Erlang `nodes`. To avoid confusion with Kubernetes terminology, I'll use the prefix `k8s` when referring to Kube.

## A word about WSL
You may run into one issue if you're using WSL: by default, WSL systems use the same hostname as their Windows host, which isn't fully qualified, and Erlang may not like that.

To fix this (and to avoid breaking WSL), you can specify a full computer name on Windows.
1. Go to your PC settings (`This PC` -> `Properties` -> `Change Settings` -> `Change`),
2. In the `Computer/Domain Changes` window, keep a simple Computer Name,
3. Click on More, and in the `DNS Suffix and NetBIOS Computer Name` window, specify a primary DNS suffix (like `localdomain`).

You can keep the other settings unchanged, provided you have something like `barney` as computer name and `barney.localdomain` as full computer name.

## Connecting nodes locally
Let's make a new clean project with Mix:
```
> mix new cluster
> cd cluster
```

And let's start a `iex` REPL, giving it a new argument:

```
> iex --sname a
```

Here, we just passed a flag to the Erlang VM, specifying the shortname of the node we want to run.

There's now a slight difference appearing in your prompt:
```
iex(a@{HOSTNAME})1>
```

You should see your PC hostname at the right of that `@` symbol. This is a default value, because we haven't specified a fully qualified name.

Let's start a second Elixir app, in another terminal:
```
> iex --sname b
```

And let's discover a few functions!

* `node()` (or `Node.self()`) returns the name of the current Node.
* `Node.list()` returns a list of the connected Nodes in the cluster. At this point, it should be empty.
* `Node.connect()` and `Node.disconnect()` allow you to, you guessed it, connect and disconnect nodes. Let's try it!

On the `b` Node, type:
```
Node.connect(:a@hostname)
```

Now, go back to the `a` Node, and run:
```
Node.list()
```

You should see `b@hostname` appearing there. Congratulations :) We haven't done anything spectacular this far, but this is exactly what `libcluster` will do under the hood once it's set up correctly.

## Todo
So, here's what we'll have to do:
1. Pass the relevant fully qualified name to each Erlang VM
2. Update our Kubernetes configuration
3. Define a cluster topology to configure `libcluster`

## VM Args
We'll need to pass some arguments to our Erlang VMs.
Since at least its version `1.10`, Mix can handle this (you won't need to add Distillery as a dependency).

In your project directory, run:
```
mix release.init
```

This command will generate a few files. Let's take a look at `vm.args.eex`. It should contain a few commented lines, specifically:
```sh
## Customize flags given to the VM: http://erlang.org/doc/man/erl.html
## -mode/-name/-sname/-setcookie are configured via env vars, do not set them here
```

Since we want to set `name` and deploy on Linux containers, let's get to `env.sh.eex`. There's a few commented lines in there, but we're most interested in the last block:
```sh
# Set the release to work across nodes. If using the long name format like
# the one below (my_app@127.0.0.1), you need to also uncomment the
# RELEASE_DISTRIBUTION variable below. Must be "sname", "name" or "none".
# export RELEASE_DISTRIBUTION=name
# export RELEASE_NODE=<%= @release.name %>@127.0.0.1
```

To enable clustering, we need to replace the `127.0.0.1` part with the fully qualified name of our pod. Kubernetes has its own internal DNS, and pods are typically named like this:
```
# Assuming our Pod IP is 192.168.0.45
192-168-0-45.namespace.pod.cluster.local
```

So your setup should end up looking like this:
```sh
export POD_A_RECORD=$(echo $POD_IP | sed 's/\./-/g')
export RELEASE_DISTRIBUTION=name
export RELEASE_NODE=myapp@$(echo $POD_A_RECORD).$(echo $NAMESPACE).pod.cluster.local
```

Both `$POD_IP` and `$NAMESPACE` will have to be defined when our application starts, so we'll add those to our k8s deployment manifest.

## Kubernetes configuration
We should now declare our two new environment variables:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: default
spec:
  selector:
    matchLabels:
      app: myapp
      tier: web
  template:
    metadata:
      labels:
        app: myapp
        tier: web
    spec:
      containers:
        - name: myapp
          image: <Image>
          resources:
            limits:
              memory: "128Mi"
              cpu: "500m"
          ports:
            - containerPort: <Port>
          env:
            - name: NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
```

Both variables references the pod's information once it's started. You can check it by running:e by running:
```
kubectl get pod myapp-456789 -o yaml
```

If you already have one pod correctly labelled, you can check that libcluster will correctly poll the right pods from Kube by doing what it does: polling with a labelSelector:
```
kubectl get pods -l app=myapp,tier=web
```

If this returns off-topic pods, then you should fix this before proceeding :)

## Libcluster topology
Last, but not least, we need to specify our libcluster strategy:
```elixir
topologies = [
  default: [
    strategy: Cluster.Strategy.Kubernetes,
    config: [
      mode: :dns,
      kubernetes_node_basename: "myapp",
      kubernetes_selector: "app=myapp,tier=web",
      kubernetes_namespace: "default",
      polling_interval: 10_000
    ]
  ]
]

[
  {Cluster.Supervisor, [topologies, [name: Myapp.ClusterSupervisor]]}
]
```

Once you deploy this, you should be good :) After scaling up your deployment (`kubectl scale --replicas=X deployment/my-app`), you should see various `[libcluster]` log entries on your pods.

## What now?
There's a few things to toy around with if you want to leverage your cluster!

Starting from there, and after cleaning your configuration and/or setting up cleaner environment variables, there are a few interesting things to do. How about:
* Declaring a GenServer tracking nodes status?
* Implementing a Cluster Singleton worker using [Individual][8]?
* Toying around with Phoenix.PubSub?
* Playing with process registries, like Phoenix.Tracker?
* Discovering Erlang's [Mnesia][9], a powerful in-cluster DBMS to use for internal state or cache, and which makes Redis irrelevant?

## Node up/down notifications
[Erlang exposes a simple function][10] that'll get the current process notified when nodes are up or down. This can allow us to react accordingly, like printing debug information in the logs, dereferencing the node, or push the self destruct button.

In our first example, if you had run the following before connecting the two nodes together:
```elixir
:net_kernel.monitor_nodes(true)
```

Then running `flush` would show you the messages you received:
```elixir
{:nodeup, :a@Hostname}
```

You can call `monitor_nodes` in a [GenServer][11], of course, and implement the relevant callbacks:
```elixir
def handle_info({:nodeup, node}, state) do
  IO.puts("[STORE] Node connected: #{inspect node}")
  {:noreply, state}
end

def handle_info({:nodedown, node}, state) do
  IO.puts("[STORE] Node disconnected: #{inspect node}")
  {:noreply, state}
end
```

## Conclusion
This article is a bit long and rough around the edges, but it should give you a better understanding on how to deploy Elixir applications as a cluster.

I strongly suggest that you follow the official documentations of Elixir, Erlang and libraries. The snippets I included may get outdated over time, though I don't expect the process to be easier than it currently is :)

[0]: https://hexdocs.pm/libcluster/readme.html
[8]: https://github.com/Virviil/individual
[9]: http://erlang.org/doc/apps/mnesia/Mnesia_chap2.html
[10]: http://erlang.org/doc/man/net_kernel.html#monitor_nodes-1
[11]: https://elixir-lang.org/getting-started/mix-otp/genserver.html
