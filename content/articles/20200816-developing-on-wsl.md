+++
title = "Developing on WSL"
date = 2020-08-16
[taxonomies]
tags = ["tutorial", "wsl", "dev"]
+++

## Context

The latest versions of Windows 10 have seen the maturation of WSL, the Windows Subsystem for Linux. Basically, it allows installing a Linux distribution that'll use a special Linux kernel running "nativaly" on Windows 10. It doesn't run on a virtualized environment, although it seems to use a Hyper-V volume for storage.

Oh, and you can also use their shiny new [Terminal][0] for ultimate ease of use.

## The Good

### Seamless development

You will evolve in a familiar environment if you're already using VSCode, since it leverages its client/server architecture, each running on Windows and Linux respectively. Typing `code .` in your terminal will open VSCode. Extensions will be installed server-side.

Other than that, you can enjoy the benefits of using any regular Linux distribution.

### You can use Docker

Since the release of WSL 2 (included in the 2004 Windows update), you can use Docker containers inside your Linux distro, managed by your Docker daemon installed on Windows. "All" it requires is using a WSL2 compatible distribution, and enable WSL2 integration in the Docker Desktop preferences.

And, instead of using a virtual machine to host the containers, you can also set Docker Desktop to use... WSL2.

![Brain explosion](/assets/memes/brain_explosion.gif "Brain explosion")

I haven't made any benchmarks, but I suppose it helps to boost performance.

I suppose you can even use your Kubernetes cluster installed with Docker on Windows from your Linux distribution, but I haven't come that far into testing yet.

### Accessing files between Linux and Windows

Your Windows volumes are automatically mounted in `/mnt`, meaning you can literally access anything from your Windows installation. Also, typing `explorer.exe .` reveals the current folder in Windows' file manager, shown as a network shared volume.

## The Bad

### Occasional bugs and freezes

I do backend development in Ruby (and Rails), Elixir (and mostly Phoenix) professionally, and I also wrote a bit of Elm and Rust in WSL2. I am quite satisfied with the quality of the integration WSL2 offers, but it isn't bug-free either.

For example, when I first tried Zola and ran its web server, I just couldn't connect to it with my browser. Firefox was just displaying "Unable to connect". The reason? I don't know, but running `wsl.exe --shutdown` would "solve" this problem. I'm obviously more annoyed by the fact that I _need_ to reboot than the fact that I only lose a few seconds of my time every week or so.

But the most annoying thing was occurring during the compilation of my Rust project through Docker (it never happened when I was building "on bare metal"), which was the complete freeze of VSCode, my terminal, and really, any app related to WSL. In that case, I'd need to wait for a few minutes for the build to finish and my system to be responsive again. I assume this has something to do with my building process eating all of the IO reserved for WSL, or something related to this weird Docker setup.

### Wondering about long-term stability

While Microsoft provided a migration script to switch from WSL to WSL2 (through the use of `wsl.exe`, to run in `cmd.exe` or PowerShell), it never worked on the Ubuntu I installed a few months ago, so I tried a few several other distributions (Alpine, Arch) after finally installing a fresh new Ubuntu, which worked instantly with Docker integration. I think not all distributions available on the store are compatible with WSL2, but information is a bit scarce.

So far, my setup has been very stable, but I wonder if a future Windows update could break the whole thing. I got almost anything versioned and hosted somewhere, but still.
And sure, there's bugtracking through Github, but I think WSL as a whole is pretty opaque and hard to debug yourself.

## The Ugly

### Get out of my $PATH

To achieve a seemless integration with Windows, my Ubuntu installation has basically the whole Windows mess injected into its default $PATH:

```
➜  / echo $PATH
/home/makks/.asdf/shims:/home/makks/.asdf/bin:/home/makks/.cargo/bin:/home/makks/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/mnt/c/Windows/system32:/mnt/c/Windows:/mnt/c/Windows/System32/Wbem:/mnt/c/Windows/System32/WindowsPowerShell/v1.0/:/mnt/c/Windows/System32/OpenSSH/:/mnt/c/Program Files/NVIDIA Corporation/NVIDIA NvDLISR:/mnt/c/Program Files (x86)/NVIDIA Corporation/PhysX/Common:/mnt/c/Program Files/Git/cmd:/mnt/c/WINDOWS/system32:/mnt/c/WINDOWS:/mnt/c/WINDOWS/System32/Wbem:/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/:/mnt/c/WINDOWS/System32/OpenSSH/:/mnt/c/Program Files/Docker/Docker/resources/bin:/mnt/c/ProgramData/DockerDesktop/version-bin:/mnt/c/Users/Makks/.cargo/bin:/mnt/c/Users/Makks/AppData/Local/Microsoft/WindowsApps:/mnt/c/Users/Makks/AppData/Local/Programs/Microsoft VS Code/bin:/mnt/c/Users/Makks.cargo/bin:/mnt/c/Users/Makks/AppData/Local/GitHubDesktop/bin:/mnt/c/Users/Makks/AppData/Local/Microsoft/WindowsApps
```

Whish is... yeah. It itched me in many places when I saw this, and when I saw random DLLs popping in my autocompletion. But this is sadly probably the price to pay for this kind of integration.

[There's a setting to disable this][1] (and even a few other things), but my distro just didn't cared about my feelings and refused to apply it. Judging by the comments section, I'm not alone in this situation.

This kind of dirty black magic may annoy you if you want your distro to be 100% clean. But I guess you wouldn't want to use WSL in the first place in that was the case ;)

## Conclusion

I'm very satisfied with WSL and its related developments so far. My primary reason for using it is the need for good UI and accessibility tools, because I have an extremely low vision (but I'll run into details in a future article) but it's also really satisfying to leverage a good CPU (in that case, a Ryzen 3800X) instead of the traditional coughing overpriced Macbook Pro any startup company grants its employees with.

And of course, you can launch a game or two when you need a break.

[0]: https://github.com/microsoft/terminal
[1]: https://devblogs.microsoft.com/commandline/automatically-configuring-wsl/
