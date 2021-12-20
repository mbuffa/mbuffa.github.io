+++
title = "Kubectl: Useful shortcuts"
description = "Various and useful kubectl tips to ease your life on your Kubernetes cluster"
date = 2021-12-20
[taxonomies]
tags = ["k8s"]
+++

## Context
`kubectl` is the command line tool for accessing and interacting with your Kubernetes cluster. It's quite intuitive and easy-to-use, but here is a small summary of some very useful commands to get you started if you're new to Kube.

You should already know a few basics about building a Docker container and firing a simple deployment on Kubernetes though. This won't help you much if you don't know Kubernetes at all :-)

Anyway, here's a quick catch-up:
* To deploy a basic app on Kube, you would typically write a *Deployment*, featuring a template with a list of *Container*s.
* Once applied, this *Deployment* will have an associated *ReplicaSet* linked to the template you specified, and managed by Kube.
* Each *ReplicaSet* will then create *Pod*s accordingly (depending on the amount of replicas you set).
* And finally, each *Pod* will wrap the *Container*s you specified in the aforementioned template.
* Additionally, *Service*s will provide a single **Endpoint** to your app **inside** your cluster, while *Ingress*es will provide access from **outside** your cluster, redirecting traffic to the **Service**.

I'll try to update this article if I discover or remember some good shortcuts. It would be pretty long and tedious if it was a full tutorial, so I'll keep this light.

## A good entrypoint
`kubectl explain` is here to help you. You can use it on any kind of ressources inside Kubernetes:
```sh
kubectl explain deployments
```

This is really useful, especially when combined with some IDE plugins. VSCode has some that add snippets, and even a cluster visualizer that lets you browse all your ressources from inside your editor! You can easily learn something about a new type of ressource you didn't know about.

## A simple way to open a TTY to your pod
You may already know that you can open a terminal over SSH by simply running:
```sh
kubectl exec -it my-app-1234-5678 -- /bin/sh
```

If you're deploying quite often, the replicaset attached to your deployment will change, and pods will be recreated. Therefore, opening a new TTY can be tedious.

But fortunately, you can use the service as a shortcut:
```sh
kubectl exec -it service/my-app -- /bin/sh
```

## Accessing multiple apps logs
You may know that you can access a container logs, either statically or continuously, by running this:
```sh
kubectl logs [-f] my-app-1234-5678 container_name
```

But yet again, the pod may be replaced, and you may be interested to fetch logs from multiple pods of the same app, or even logs coming from various apps, but serving a common purpose.

You can do just that by adding **[Labels][0]** to your ressources (especially deployments), and running the same command, but with *Label Selector*s instead:
```sh
kubectl logs [-f] -l app=my-app -c container_name
```

In fact, selectors can be used with many commands, including all `get` calls, to fetch ressources of different nature grouped by-whatever-your-semantic-grouping-is. No more `grep` :-)

[0]: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/
