+++
title = "Kubernetes: Creating and using Operators"
description = "A beginner guide to solve some issues with operators"
date = 2022-01-22
[taxonomies]
tags = ["tutorial", "k8s"]
+++

## Context

I recently had to deploy a variant of an existing application, with a small set of common REST APIs with additional endpoints, and a few specific applications to fit the business needs of that product. I encountered an issue though: my ingress configuration (using Traefik) needed to have access to my certificate in that same namespace. I'm pretty sure Kubernetes namespaces are completely isolated compartments, but I tried to access that secret in my default namespace nonetheless, without success.

Also, that certificate would be renewed every once in a while.

So I basically had three solutions:

- Copy the secret manually, initially and then after each certificate update
- Update the certificate update procedure, so that the person updating it would also update the one in my namespace
- Copy the secret on a regular basis, either with a Kubernetes CronJob or a deployed app

The first solution was too error-prone. I'd rather write and validate a script once and schedule it, rather than trusting my self in six months, with clouded memory and human nature.

The second solution would have required me to have access to that update procedure, and having anyone deploying in a new namespace the obligation to update that procedure (or warn about it) for each new namespace. Not really resilient to human errors and not scalable by definition.

The third solution was the most tempting, but I found a more elegant and equally reliable way to do this.

## Solving this with an Operator

A [Kubernetes Operator][1] is a fancy word for applications subscribing to the Kubernetes event loop and executing some code in return. Classic PubSub.

Operators aren't a ressource as can be Pods, Deployments or ConfigMaps. They're just deployed apps with a certain design, and there are several ways to create one.

## The Don't-Reinvent-The-Wheel way

In my case, I wanted to have something running in a reanosably short timespan. There are ways to build your own operator "from scratch" (at least, without [having to invent the universe][4]), but I went for an "out-of-the-box" solution called [shell-operator][2], allowing you to write a simple YAML manifest for the subscription, and some UNIX shell scripting for the code execution.

The README is pretty straightforward and does a very good job, so I won't elaborate step-by-step on this. There are even examples, [such as this one][3]. I wouldn't do a better job than the author himself. Advertising the use of Operators is the best I can do here :-)

Anyway, you basically end up with a Dockerfile, a shell script both used to create the subscription hook and the code execution (in which you can of course run `kubectl apply -f` if it has the required permissions), and you only have to build your new container and deploy it.

In my case, I ended up having a specific deployment for every namespace I deployed (and that is intended to not be a temporary namespace, and have a lifetime superior to the renewal period). I could have deployed only one operator and have it update the secret in all namespaces at once, but that basically killed the principle of compartmented and independant namespaces.

## The Do-It-Yourself way

I also like to master what's happening and have a low-level understanding of things, so I'll try to update this article (or create a new one) about creating your own operator soon. Yeah, sorry, that section is currently a scam.

[1]: https://kubernetes.io/docs/concepts/extend-kubernetes/operator/
[2]: https://github.com/flant/shell-operator
[3]: https://github.com/flant/shell-operator/tree/main/examples/101-monitor-pods
[4]: https://youtu.be/zSgiXGELjbc
