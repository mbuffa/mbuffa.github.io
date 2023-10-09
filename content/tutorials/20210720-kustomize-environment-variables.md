+++
title = "Kustomize: Using Environment Variables"
description = "Using Environment Variables in your Kubernetes manifests"
date = 2021-07-20
[taxonomies]
tags = ["k8s"]
+++

## Context
Using environment variables in your Kubernetes manifests built with Kustomize may be a bit tedious, but I recently found how you can actually use some.

## Prerequisites
I won't go into too much details about Kubernetes manifests, or deploying on Kubernetes in general. I learned as I went, mostly by looking at examples and documentation. If you're looking for tutorials or courses, there are pretty good resources available for free. [This great article][0] gives some very useful tips to learn by doing, and there's even [an official interactive tutorial][1].

And, of course, you also need to know Docker :-)

## Let's get started

Let's take this stripped down deployment example, named `deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  MYAPP
  namespace: default
  labels:
    app:  MYAPP
spec:
  selector:
    matchLabels:
      app: MYAPP
  replicas: 1
  template:
    spec:
      containers:
      - name:  MYAPP
        image:  MYAPP:latest
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
          limits:
            cpu: 100m
            memory: 100Mi
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: MYAPP
              key: DB_HOST
        ports:
        - containerPort:  80
          name:  MYAPP
      restartPolicy: Always
```

You would typically associate this with a `Kustomization.yaml` file:
```yaml
resources:
  - deployment.yaml
```

This file allows you to define values shared across multiple resources (like services, jobs, ingresses...), either by editing it directly, like this:
```yaml
resources:
  - deployment.yaml

namespace: web
```

...or programmatically, for example, in your CI:
```sh
$ kustomize edit set namespace web
```

Running `kustomize build .` in the directory containing your kustomization and deployment would result in an output that you could apply directly with `kubectl apply`. Just run `kustomize build . | kubectl apply -f -` and you're good to go.

Now let's say we want to add an annotation at build time in our CI with an environment variable, like this:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name:  MYAPP
spec:
  template:
    annotations:
      example.com/git-commit: $(CI_COMMIT_SHORT_SHA)
```

This can be pretty useful if, for example, you want to do a new deployment even if the docker image specified in that deployment hasn't changed.

Running `kustomize build .` now would keep that line as-is.

In that case, you *could* add an annotation programmatically, like this:
```sh
kustomize edit add annotation example.com/git_commit:$CI_COMMIT_SHORT_SHA
```

But then all your resources would be affected, mearning that your service and ingress would also be redeployed in that example. In some cases, you really want to scope your changes.

To use environment variables, you need to specify them in your `Kustomization`, in a `vars:` section:
```yaml
resources:
  - deployment.yaml

vars:
- name: CI_COMMIT_SHORT_SHA
  objref:
    kind: ConfigMap
    name: environment-variables
    apiVersion: v1
  fieldref:
    fieldpath: data.CI_COMMIT_SHORT_SHA
```

Each variable defined here must have a name and references to let Kustomize know where it's supposed to get that value. In that example, I'm using a `configMap`, which is often the best option to store configuration.

While we could definitely define a `ConfigMap` ourselves as part of our `Resources`, we would lose the ability to define that variable at build time.

That's why we want to build a `ConfigMap` programmatically, by sourcing a file we'll create in our CI:
```yaml
resources:
  - deployment.yaml

configMapGenerator:
- name: environment-variables
  envs: [environment-properties.env]
  behavior: create

vars: ...
```

There's one more thing we need to do though. For the sake of testing your code locally, just create a file named `environment-properties.env` containing the following content:
```
CI_COMMIT_SHORT_SHA=unknown
```
(You should keep that file tracked in your CI, it would make debugging locally easier.)

Running `kustomize build .` at this point would, still, keep that variable as-is. That's because we try to substitute a value in a field that Kustomize doesn't look in by default, probably for performance or security concerns.

To fix this, we need to add a custom transformer. Put that in your Kustomization:
```yaml
configurations:
  - env-var-transformer.yaml
```

And then create `env-var-transformer.yaml` with that content:
```yaml
varReference:
  - kind: Deployment
    path: spec/template/metadata/annotations
```

Now, running `kustomize build .` locally should give you the expected result.

Finally, in our CI job, we can build that file:
```sh
echo CI_COMMIT_SHORT_SHA=$CI_COMMIT_SHORT_SHA > environment-properties.env
# And then, you just have to apply your changes:
kustomize build . |kubectl apply -f -
```

Now running `kustomize build .` would result in this :-)
```yaml
apiVersion: v1
data:
  CI_COMMIT_SHORT_SHA: "123456"
kind: ConfigMap
metadata:
  name: environment-variables-2t266m664k
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    annotations:
      example.com/git-commit: "123456"
```

Tada!

Kustomize has a predefined list of fields it'll actually replace corresponding patterns with environment variables. You can check this list [directly in the repository][2]. If you want to do variable substitution in a field that is not in that list, you can follow the section `I want to put $VAR in some (currently disallowed) field` [on this Github issue][3], which points to the aforementioned source file.

Hope this will help some people stumbling around here.

[0]: https://prefetch.net/blog/2019/10/16/the-beginners-guide-to-creating-kubernetes-manifests/
[1]: https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-interactive/
[2]: https://github.com/kubernetes-sigs/kustomize/blob/a280cdf5eeb748f5a72c8d94164ffdd68d03c5ce/api/konfig/builtinpluginconsts/varreference.go
[3]: https://github.com/kubernetes-sigs/kustomize/issues/2052
