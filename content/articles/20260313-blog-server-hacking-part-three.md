+++
title = "Blog: Hacking my Linux server at home - Part 3"
description = "MicroK8s + ArgoCD + Vault + Kustomize <3"
date = 2026-03-31
[taxonomies]
tags = ["blog", "server", "sysadmin", "dev-ops", "k8s"]
+++

### See also
* [Part One][0]
* [Part Two][1]

## Context
In my previous post, I described how I setup Gitea, Act, Minikube and a Cloudflare Tunnel to be able to host my own zeb apps on my server, and ended the post with a list of things to do.

Let's take a look at the "roadmap" at the end of the previous post:
* Setting up ArgoCD (GitOps),
* Setting up Grafana LGTM for Observability, Logs, Tracing (exciting!),
* Setting up SOPS for secrets management (would allow storing the ingress certificate in VCS securely),
* Adding a new machine as a cluster node (ok, this one is definitely not next, I need to buy the hardware) (and swapping Minikube with MicroK8s?),
* Server hardening.

Long time, no see. I did a couple of things since the last update :-) and today, I'll detail how I set up HashiCorp's Vault and ArgoCD, among some minor tweaks, and more importantly, why I made those choices over others.

## Swapping Minikube with MicroK8s
Let's evacuate the less interesting things first. When it comes to deploying Kubernetes on your own hardware, several options stand out. One of them is Minikube, another is McroK8s. The first one worked for me, but was not offering multi-nodes support, so I figured migrating would bring a few benefits, including some "builtin" plugins such as Helm or ArgoCD.

No Arch Linux packages for MicroK8s, it's distributed mainly as `snaps`, universal Linux binaries. Canonical's documentation proved relatively easy to follow, and MicroK8s came with its own SystemD services to manage its various services. Nice.

I did encounter some obstacles however. Since the Cluster IP was different, I had to figure out how to rewire my various `socat` port forwards to correctly re-route traffic between Docker (for the registry and the CI on Gitea), MicroK8s, and incoming traffic from Cloudflare.

But the biggest issue I ultimately faced was random failures on my `socat` port forward between containers running in my CI, and my Docker registry, this time managed by MicroK8s. For no apparent reason, `docker push` would randomly fail when using the Docker bridge IP.

I eventually resorted to use the same network as the host for Act when running containers, which is... arguably not great, but probably not that terrible either, since I will be the first person to either push code and run CIs.
```sh
# /etc/act_runner/config.yaml
host:
  network: "host"
```

Definitely not a setting you would toggle in a serious production environment, but I needed a stable base to improve on. I did investigate socat's TTL, IPv6 vs IPv4 and a couple of other parameters. I'm still unsure what's going on.

Let's move on to the main dishes :)

## Handling Secrets
Storing and managing passwords (and more generally secrets) has always been a great source of smile or happy bullying in some places, with stories ranging from "somebody guessed my password and posted nasty things on Slack" to "somebody stole my whole crypto wallet and spent $5000 with my OpenAI key".

Mismanaging secrets has always been terrible, but with the rise of malwares, and, more recently, the adoption of AI tools basically indexing your folders and sending those into requests, that's definitely something you want to handle with a minimum of discipline.

There's usually two types of configuration: unsensitive data (identifiers, usernames, URLs without auth) and secrets, such as passwords, private keys (for asymetric algorithms), or tokens. We're interested in the latter here. 

Some secrets are long or short lived. Things like OAuth2 tokens, valid for a relatively short period of time, are usually stored in application state, cache or databases, and refreshed often.
Long-lived secrets usually do not receive that much attention though, especially when you start building a service. You just put things into variable environments (either directly or through your PaaS abstraction, like `fly secrets`), and it stays there for 5 years before seeing its first-ever renewal.

Let's say we need to have a couple of secret keys to deploy our app, and we want to generate a Kubernetes secret that our app will have access to.
We could:
* Store the `secret.yaml` file with plain values in code. It would completely defeat the purpose of secrecy.
* Keep our `secret.yaml` file aside, in a safe place, such as our password manager. Not great, not lean, tied to one account (that would become one more SPOF in your organization), but at least confidential.
* We could set up environment variables in our CI, and substitute values just before deployment. Sure, it works, but anyone able to run the CI can extract those values.
* We could commit the file with some encryption in our repository, that would be decrypted during the deployment. That's basically how SOPS[2] work.
* We could also store secrets in database. This works for scoped configuration (eg. user tokens), but not for config you expect to be set before your app starts. Abusing it would break your apps lifecycles and prevent K8s to restart or redeploy apps when needed.
* Or, we could use a Kubernetes operator providing `External Secrets` and combine it with a password vault.

I chose the last option for the following reasons:
1. Using SOPS requires you to manually re-encrypt, commit and push any file you want to handle as a secret,
2. `External Secrets` are represented by Kubernetes CRDs (custom definitions) whose state you can track: you can see if something went wrong when trying to update a secret.
3. And more importantly, `External Secrets` let you manage the lifecycle of secrets at "the top of the pipeline", or, so to speak, in the "SecOps domain", meaning you can just update the source of truth, and let "third parties" pull updates, without having to run between heterogenous apps to figure out how they store their secrets.

You can leverage AWS or GCP infrastructure here. I chose the pure self-hosted approach and decided to go with HashiCorp Vault :)

## HashiCorp Vault
HV is essentially an infinite strongbox allowing you to store secrets in various forms, with several engines offering "multi-modal" patterns through engines (for example, Cubbyhole[3] for Key-Value store). You can access it with your user account defined at setup, but will eventually require multiple keys to unseal the strongbox (be sure to save those 5 setup keys in a safe place).

If you suspect an intrusion or unauthorized access, you can seal your vault from the UI, preventing data from being pulled. HV also has a couple of enterprise features, such as recovery, integrating to LDAP, ACLs, and so on.

And after a bit of setup, you end up with something like this :)
{{ picture(path='/assets/screenshots/2026-03-31-vault.png', class="article-picture") }}

HV also exposes a handy CLI:
```
$ VAULT_ADDR=http://127.0.0.1:PORT vault status
Key             Value
---             -----
Seal Type       [REDACTED]
Initialized     true
Sealed          false
Total Shares    5
Threshold       3
Version         [REDACTED]
Build Date      [REDACTED]
Storage Type    file
Cluster Name    [REDACTED]
Cluster ID      [REDACTED]
HA Enabled      false
```
And this CLI also allows you to pull secrets from the commandline.

But let's move on to the really exciting and squishy part!

## ArgoCD: Why, How, WTF?
{{ picture(path='/assets/screenshots/2026-03-31-argo-splashscreen.png', class="article-picture") }}

Is there anything you could refuse to that face :)?

Here's a reminder of my previous setup:
- A CI Runner (Act) pulling `kubectl` and applying my Kubernetes manifests directly.
- Two different CI pipelines for testing (CI) and automatically deploy `main` builds to my cluster (Continuous Delivery).

Whether you would replace "raw" K8s files with Helm or Kustomize, this flow would essentially be the same. And would work.

But here's a few things that can go or seem wrong with this approach:
1. You have to monitor a successful deployment manually.
2. It can be hard to track or debug failures: you would add logs to your CI, rely on `kubectl` or a TUI to check your K8s ressources manually...
3. You have to explicitly declare all the necessary steps for your app to deploy: update config maps, secrets, migrate your database...

What if I told you you can have, at the same time:
1. A nice UI to visually monitor your K8s deployments, to see their status, failure reasons and logs.
2. A process that'll automatically sync your app to the cluster.
3. A great separation between your actual application code, and the CD configuration to deploy it.

Argo[4] is basically the "Cluster Admin Dashboard", or at least one of them :) It leverages the GitOps approach to deploy software, adopting the semantics of Git to make the experience flawless and concentrate everything relted to CD.

After a quick setup (as a MicroK8s addon, in my case: it lives in a specific namespace in my cluster), I just created a new application, specified the Git repository that Argo would listen to, and started debugging and adapting my configuration.
It took a bit of time to get it right, and also to figure out what was going wrong with my secrets configuration, but I eventually ended up on a green light :)

I'm *almost* sure you can setup apps on Argo just by pointing to your app repo directly, since you can specify paths and branches. But in my case, i chose to separate things in a strict manner, so I ended up with:
* A new repo, `cd-suto`, containing my Kustomize deployment config, a lightweight CI to update my deployment Docker image and push it to the repo,
* My app repo `suto`, with a `test` CI, and a `deploy` CI triggering the `update-image` CI using a Gitea webhook.

That additional step in my deploy CI did the trick:

```yaml
- name: Trigger ArgoCD deployment
run: |
    curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: token ${{ secrets.CD_TOKEN }}" \
    "${{ vars.FORGE_URL }}/api/v1/repos/MakkuSoft/cd-suto/actions/workflows/update-image.yaml/dispatches" \
    -d "{\"ref\": \"main\", \"inputs\": {\"image_sha\": \"${{ env.DEPLOY_SHA }}\"}}"
```

And so, my workflow on `cd-suto` would trigger, build and push my docker image, run `kustomize edit set image tinker:32000/suto:${{ inputs.image_sha }}`, commit and push to the repo, and Argo would then listen and sync!

I'm still a very early user of Argo and do not have much experience with it, but after 3 years with custom CI/CD and CLI tools, Argo UX already looks frankly fantastic to me. Also, of course, in the context of a large organization, Argo also allows you to use one monorepo for deployment, with paths and branches dedicated to your apps.

One specific thing that Argo allows is the separation of "deployment steps" into "waves". Let's say you have a typical Elixir or Rails application that requires to run database migration before running. With a custom Gitlab CI, what I would typically do prevously would be running the K8S job separately, then applying my deployment.

Argo allows you to define waves as metadata, so it rolls deployments in a very, very simple way:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: suto-migrate
  namespace: suto
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
    argocd.argoproj.io/sync-wave: "-1"
  labels:
    app: suto
    component: migration
spec:
  ...
```

This reflects on Argo UI, and you can tell the hierarchy between your top dependencies (config map, vault store), medium deps (external secret). Extremely nice!

{{ picture(path='/assets/screenshots/2026-03-31-argo-suto.png', class="article-picture") }}

I'll definitely try to blog about tips and tricks about Argo when I get more used to it :)

## A quick note about K8s manifests: Kustomize vs Helm
I briefly mentioned that I migrated my Kubernetes files (which were just plain YAML files). This initial setup had a couple of issues:
1. My config map was not versioned (name set to `suto-config`) which meant my app wouldn't restart when my config map would have been updated.
2. It requires a bit of `sed` to update the hardcoded Docker image in several manifests. Which is a terrible idea.
3. There was no guaranteed consistency between my manifests labels, annotations...

Helm is the "historical" way to "customize" K8s manifests. Kustomize is a newer one, and I prefer it for the following reasons:
1. It uses YAML (a "kustomization") to generate more YAML, instead of using templating and variable substitution like Helm does; it's basically a match between a PHP Engine, or a Markdown static site generator: it's simpler, less prone to errors, and more elegant. I only have to think about YAML entries, not templating DSL.
2. It offers a centralized and clear way to correctly manage things like config maps (with config map generators) with built-in versioning, common labels and annotations.
3. It does not come with an additional layer of CRDs like Helm (Helm Releases), which seem completely redundant with the addition of Argo to the mix.
4. Generally speaking, I think it's more adapted to small codebases.

I still do like Helm a lot for being able to deploy pre-built software, like Traefik, Argo, and so on, but that's it.

To give you a short example, here's what a Kustomization file may look like:
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: suto

configMapGenerator:
- envs:
  - config.properties
  name: suto-config
  namespace: suto
  options:
    annotations:
      argocd.argoproj.io/hook: PreSync
      argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
      argocd.argoproj.io/sync-wave: "-2"

labels:
- includeSelectors: true
  pairs:
    app: suto

commonAnnotations:
  deploy.suto/commit-sha: 42ed863182efffb470a64554c3a77109a9aacb5e

resources:
- secret-store.yaml
- secret.yaml
- namespace.yaml
- migrate-job.yaml
- headless-service.yaml
- deployment.yaml
- service.yaml
- ingress.yaml
images:
- name: [REDACTED]/suto
  newTag: 42ed863182efffb470a64554c3a77109a9aacb5e
```

## Wrap-up
Anyway, we're starting to have a really nice setup here, still very fragile in a couple of areas, but already more elaborate (or closer to the state-of-the-art) than a lot of software companies' own architecture :)

On this server, we do have:
* Remote access with SSH,
* A K8s cluster,
* A Git Forge (Gitea),
* A CI Runner (Act),
* A Postgres server,
* Vault to store secrets,
* Argo to manage deployments.

There's a couple of things that I want to tackle from now on:
* Buy another server, and add it to the K8s cluster.
* Setup an OpenTelemetry stack (Grafana's LGTM :) and start using Tracing and Logs.
* Host Postgres inside K8s using PG CloudNative operator, to minimize risks of breaking updates and segregate services, and also enable replication.
* Swap Gitea with Forgejo: Not the most useful move, but Forgejo is the community-driven fork of Gitea, and will probably receive more updates in the long run.
* Migrate to a "dedicated" CI instead of using Act. It's directly compatible with Github Actions, but this proximity creates space for inaccurate implementation or missing documentation. Maybe Woodpecker CI?
* Possibly host Gitea/Forgejo on a separate VM, to separate source code from runtime.
* Add automatic backup/syncing of configuration and data to Proton Drive (I already track my server config files using Git).

Thank you if you had the patience to read through all of this, do not hesitate to post or DM me recommendations or questions.

Stay tuned!

[0]: /articles/20251110-blog-server-hacking-part-one
[1]: /articles/20260120-blog-server-hacking-part-two
[2]: https://github.com/getsops/sops
[3]: https://developer.hashicorp.com/vault/docs/secrets/cubbyhole
[4]: https://argoproj.github.io/cd/