+++
title = "A* (A Star) Live Demo"
date = 2022-11-20
[taxonomies]
tags = ["demo", "elixir", "liveview"]
[extra]
# url = "https://path-demo.fly.dev/"
screenshot = "/assets/demos/screenshots/astar/2022-11-20_20-49-44.png"

+++

## Context
This is a live demonstration of the A* pathfinding algorithm implemented in Elixir using LiveView. The implementation itself is a functional step-by-step version of the famous A* algorithm, which is most commonly used in video games.

I hacked the original version of this demo over a weekend in Feb 2021, ingesting a lot of content about pathing, and a bit about LiveView, in order to showcase it during an internal talk at Pandascore. I got back to it and refactored the whole thing later to clean it up.

Please keep in mind that this is, however, not a perfect example of algorithmic efficiency (there's a lot of linear search through lists and it could probably be better), and that there might be mistakes or imprecisions about my implementation.

## What is A*?
{{ youtube(id="-L-WgKMFuhE", class="video-embed") }}

## Demo
Head over to [Fly.io](https://path-demo.fly.dev).

You control the robot. Pick a target, find the path, and walk the path.

## Repo
Source code is available on [Github](https://github.com/mbuffa/elixir-pathfinding-demo).
