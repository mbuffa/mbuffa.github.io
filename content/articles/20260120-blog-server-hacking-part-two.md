+++
title = "Blog: Hacking my Linux server at home - Part 2"
description = "Setting up Gitea, Minikube, a CI Runner and a Cloudflare Tunnel"
date = 2026-01-20
[taxonomies]
tags = ["blog", "server", "sysadmin", "dev-ops", "k8s"]
+++

### See also
* [Part One][0]

## Context
In my previous post, I mentioned setting up a home server, which was at this point not doing a lot of things, aside from having a PostgreSQL database and a SSH server.

In this post, I'll go into details how I managed to get those components up and running:
* A working Gitea (alternative to Github),
* A CI Runner, compatible with Github Actions, for tests and deployments,
* A docker registry to hold my services images,
* A Kubernetes cluster, using Minikube,
* A Cloudflare Tunnel, to expose my services to the World Wide Web,
* And finally, the SystemD configuration files needed to make all of this work (almost) smoothly.

So, let's move on! I'll try not to flood this page with configuration files though, to keep it clean and simple.

## Gitea
Gitea was [straighforward to install][1]. In my case, there was a Arch Linux package ready for me, so I just picked that option. The idea was to have something up and running, with the least possible number of abstractions and dependencies, so I didn't think about running it inside Kubernetes, or a VM. At least, not for now.

Gitea requires a SQL database, so you'd definitely need to provide one, and check that the Postgres database would accept connections for the `gitea` user in the usual `/var/lib/postgres/data/pg_hba.conf` configuration file:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   giteadb         gitea                                   scram-sha-256
```

I believe the package was bundled with the proper SystemD config, so a simple `systemctl enable gitea` was enough to add it to the services SystemD would start on the next reboot.

**One important note though**: In my case, the gitea user was configured with a password reset every six months. So, one morning, I had the sad surprise of realizing something was broken in my setup. You can check if your password has expired by running `chage -l YOUR_USER` and `chage -E -1 YOUR_USER` to disable the password reset.

In my case, since my Gitea user was forbidden to accept TTY login, I decided to disable the password reset. It didn't seem very impactful to do so. And that user would be used only with SSH handshakes to save Git repos on disk (and, yeah, run the CI too).

After this initial setup, I was happy to open my numerous and unfinished Git repositories and run `git remote add self gitea@SERVER:USER/REPO.git`.
When it would be time to push upstream, a simple `git push` and `git push self` (or `gp` and `gp self` with shortcuts) would be enough to send to both my Github account and my Gitea server.

I needed a CI to run tests though, but that was requiring two dependencies. Let's move to the next one.

## The CI Runner
Gitea supports Github Actions, or [Drone CI][2]. I decided to go with the first option, as I already had a few Github 4s working. I wanted backward compatibility, and to be able to deploy from Github in the event that my server would go down.

I think I will eventually migrate, to, maybe, [ArgoCD][3] though, as Github Actions isn't great by itself, and, as I would discover later, Gitea doesn't actually support 100% of Github Actions. Some differences may emerge, regarding services hostnames within a test step, for example.

But anyway, we needed Docker. Just one package to install, and to make sure the service would start on boot, and we were good to go.

The [Act Runner repository][4] is a good place if you want quick notes on how to install and configure it. Downloaded the binary, ran the command to register the runner, and pasted the token I generated inside Gitea, so that the runner would be able to use it.

Remember that I'm using a single machine infrastructure. I may eventually get another Thinkcentre, so that I can declare a new K8s node on it, and have redundancy on my services, but for now, I'm configuring things on only one server, so some security configuration may apply if you decide to setup a swarm of machines.

It was relatively easy to have simple CI tasks such as tests to work. However, I wanted to be also able to deploy both trunk (automatically) and feature branches (manually). This is one part where I wished Github Actions was as good as Gitlab CI, because I wasn't able to DRY my CI with a single "deployment" step with various triggers. I had to declare two separate workflows.

But anyway, we need a Kubernetes cluster, right?

## Minikube
When it comes to having Kubernetes on your calculator, you have a few options, at least three:
* Minikube,
* K3s,
* and MicroK8s.

At least.

To be honest with you there, I quickly watched Canonical's [comparison table][5], saw that there was an Arch package for Minikube, and not for the other ones, and decided to go with it.

Not a professional benchmark, so you would say, but I'll swap the cluster "distribution" the day I lay my hands on another Thinkcentre, as I said, or even buy proper servers.

Anyway, installing Minikube was very easy, but I wrote my own SystemD service since it wasn't bundled with one:
```
[root@tinker makkusu]# cat /etc/systemd/system/minikube.service 
[Unit]
Description=Kickoff Minikube Cluster
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/minikube start --apiserver-ips=ETHERNET_ADDR
RemainAfterExit=true
ExecStop=/usr/bin/minikube stop
StandardOutput=journal
User=makkusu
Group=makkusu

[Install]
WantedBy=multi-user.target
```

The `--apiserver` part is interesting. Since my server does have two interfaces (a wireless, and an ethernet one), i needed to specify one in order to be able to use `kubectl` on my laptop. I believe you may use `0.0.0.0` here.

I also had to make sure it would run after the docker service was started, because I ended up using Docker's registry for images pull. Minikube does come with its own registry, but I wasn't able to make my cluster pull from it.

Also, I decided to make it run under my user, just like the basic official example shows. One would **probably** want to isolate the runtime to a user that isn't in the `sudoers` list though... I'll probably try to setup MicroK8s this way at some point.

Once the cluster is started, you can check that it's running by just using `kubectl get pods` or deploying hello world apps on it.
I wanted to be able to run `kubectl` from my laptop though, and this required generating a certificate on the server, copy it to my laptop alongside the `~/.kube/config` configuration, and adapt the hostname. I won't copy that here for obvious reasons.

Anyway, that's where the "interesting stuff" begins.

## Making the Runner actually deploy
This is where things got interesting, and it required me a bit of trial and error to get it right, or at least working. I'm sure there is some streamlining (and hardening) opportunity at arm's length.

I'll spare you the details about the intermediate steps, but it took a bit of work:
* to get the runner to be able to push Docker images to Minikube's registry,
* to be able to connect to Minikube's API to run kubectl commands in the runner (like `kubectl apply -f`),
* realize pods weren't able to pull images,
* set the runner to push Docker images to Docker's registry instead,
* and have every bit work without breaking another.

And this required a bit of TCP port forwarding. So I needed to add 2 SystemD services using `socat` to route traffic:
* From the Docker IP to my Minikube's registry IP (and port),
* From Any IP to my Minikube API IP (so that kubectl would work in the runner AND on external devices on the network),

This resulted in those two files:
```
# minikube-registry-forward.service
[Unit]
Description=Forward Docker bridge to Minikube registry
After=minikube.service
Requires=minikube.service

[Service]
Type=simple
ExecStart=/usr/bin/socat TCP-LISTEN:5000,bind=DOCKER_IP,fork,reuseaddr TCP:MINIKUBE_IP:5000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```
# minikube-api-forward.service 
[Unit]
Description=Forward Docker bridge to Minikube API server
After=minikube.service docker.service
Requires=minikube.service docker.service

[Service]
Type=simple
ExecStart=/usr/bin/socat TCP-LISTEN:8443,fork,bind=0.0.0.0,reuseaddr TCP:MINIKUBE_IP:8443 
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Now that I see it posted, it seems ridiculously straightforward. But I did loose a bit of hair when trying to figure out why my CI would work one day, and would stop working the next one, after I fixed `kubectl` on my laptop.

I previously mentioned that my k8s pods weren't able to pull images initially. I honestly do not remember what the message was, and maybe I was just missinbg a port forward, or some authorization, but I ended up using Docker's registry anyway.

### One more port forward
One more port forward needed to route HTTPS traffic to the cluster's ingress!
```
# ingress-https-forward.service
[Unit]
Description=Forward HTTPS to Minikube Ingress NodePort
After=network.target
After=minikube.service

[Service]
Type=simple
ExecStartPre=/bin/bash -c 'until nc -z MINIKUBE_API_IP 32655; do sleep 5; done'
ExecStart=/usr/bin/socat TCP-LISTEN:443,bind=0.0.0.0,fork,reuseaddr TCP:MINIKUBE_API_IP:32655
Restart=always

[Install]
WantedBy=multi-user.target
```

This is an interesting one. You can see that I'm starting the service after the network interface and minikube are started. But that doesn't mean they would be ready to use.

Hence the `ExecStartPre=/bin/bash -c 'until nc -z MINIKUBE_API_IP 32655; do sleep 5; done'` line, to delay the service start until Minikube is actually ready to welcome traffic.

`32655` is my Minikube port for HTTPS.

### One last thing
I needed a TLS certificate, stored as a Kubernetes secret. Of course, that secret would stay on the server. I would only reference it in my k8s files in Git.
I would eventually evaluate modern SecretOps alternatives. I only used SOPS in the past.

I'll obviously skip all the TLS generation part, which ends up with a `.pem` and a `.key`. Those are common but quite tedious to generate.

Things were not over though. At this point, I was able to access my server over my local network with a simple `/etc/hosts` entry, but I wanted to be able to access my pods over the Internet.

Gitea would stay local network only.

I remembered about DynDNS a lifetime ago. I wanted to have something similar setup, and to avoid needing a static IP address from my ISP. So I decided to go with Cloudflare Tunnels.

## Opening to the Internet
I already had a cool domain name. Now it was about time to use it.

The plan was:
* To create the tunnel, and run `cloudflared` on the server,
* To modify some DNS entries to redirect to Cloudflare's Tunnel,
* And to make sure traffic was effectively hitting the Tunnel, the Ingress, and eventually, the Pods

You can say I saw that Cloudflare "Gateway Error" gray page for a few hours.

Setup was relatively easy to follow. You can basically choose to create Tunnels from their dashboard, or yourself with the CLI, which I believe they call "Self-Managed Tunnels".

But I had forgotten to remove the `/etc/hosts` entry at some point. So I was quite a bi confused with the debugging.

The setup went basically like this:
```sh
pacman -Ss cloudflare
yay -S cloudflared
cloudflared tunnel login # Open a Oauth2 page and gets a token
cloudflared tunnel create suto-tunnel # Yeah, that's the name of my app
cloudflared tunnel route dns suto-tunnel suto.MY_SECRET_DOMAIN.io
sudo cloudflared service install # To create the SystemD files
sudo systemctl enable cloudflared
```

`sudo cloudflared service install` created a couple of services, mainly `cloudflared.service` and a timer update service which was generic enough and that I didn't modify at all.

However, my `cloudflared.service` file ended up looking like this:
```
# cloudflared.service
[Unit]
Description=cloudflared
After=network-online.target
After=ingress-https-forward.service
Wants=network-online.target

[Service]
TimeoutStartSec=15
Type=notify
ExecStart=/usr/bin/cloudflared --loglevel debug --config /etc/cloudflared/config.yml tunnel run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

One trivial detail: Using `create suto-tunnel` and `route dns` cloudflared subcommands would update your user's``~/.cloudflared/config.yaml`. So you have to make sure your services point to the right config files, if you decided to put those into `/etc/cloudflared`, of course.

I also thought that the service journal wasn't verbose at all, hence the `--loglevel debug`. I was getting crazy, not knowing if my external requests were actually hitting the tunnel, or if my DNS entries weren't properly set up or refreshed.

I still had issues with TLS though. So CF's default configuration ended up like this for me:
```
tunnel: TUNNEL_ID
credentials-file: /home/makkusu/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: suto.MY_SECRET_DOMAIN.io
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

I basically had to end the TLS encryption to my tunnel. My browser wouldn't accept my self-signed certificate otherwise, because of my own self-declared authority. Cloudflare's certificate would take the relay here.

I don't believe this is a big deal, though.

## Moment of Truth
One thing I like to do after finishing a setup just relies on pressing the power button.

You don't know if you did everything right if you kept your session alive, but forgot to enable or restart services. The only way to know is to pull the plug.

Yeah. This step took me a few times.

I think I still got an issue to this day though, because every now and then, trying to access my server would result in the Cloudflare gateway error page, and I don't think this is on them. I probably still have a race condition to fix, or to make sure the tunnel runs when all of its dependencies are ready, not just started.

## Finishing Touches
Setting up a server is nice, but it's even nicer to keep track of its configuration and ADRs, so I just created a repository for my server, similar to infamous `dotfiles`. It's just securely stored in a Proton Drive :)

I do have a `k8s` folder in a few repositories, which contain app's YAML manifests. I decided to go with Kustomize for those, because I believe it's the simplest and the cleanest way to deploy small apps on k8s, because it uses plain YAML to generate other YAML, while Helm relies on templating and substitutions. It's like replacing Wordpress with a static site generator, in a way.

And eventually, I'll probably have a "generic" CI for my server itself, for shared services, such as PostgreSQL databases with specific versions, and some observability services too :)

Helm can be very handy though, with its existing collection of charts. But I would keep it at bay for my own apps.

It's also worth mentioning that I used Claude Code from time to time, especially for generating a self-signed certificate. This definitely made this step less tedious. And since I stored my server's general info (such as IP address, the services it runs, etc) as documentation, I was able to leverage Claude in interesting ways. This post is purely from a human, though.

## Wrap-up
So, this was quite a big chunk. What's next?

Well.

I'm still undecided which one in particular is next though, as this post is pretty up-to-date with my server's current state.

What was this guy doing all of this for again?
Oh yeah. Dev server, and training.

Well, next time, I'll probably cover one of those topics:
* Setting up ArgoCD (GitOps),
* Setting up Grafana LGTM for Observability, Logs, Tracing (exciting!),
* Setting up SOPS for secrets management,
* Adding a new machine as a cluster node (ok, this one is definitely not next, I need to buy the hardware) (and swapping Minikube with MicroK8s?),
* Server hardening? Since I do not have that many services running or ports open yet, that one may be short.

Yeah. We'll see, we'll see.

Anyway, see you next time.

P.S.: I didn't include any copy of my app's kubernetes YAML files. Those are pretty standard and would have cluttered the body of this post for little added value.

[0]: /articles/20251110-blog-server-hacking-part-one
[1]: https://docs.gitea.com/category/installation
[2]: https://www.drone.io/
[3]: https://argoproj.github.io/cd
[4]: https://gitea.com/gitea/act_runner
[5]: https://canonical.com/microk8s/compare
