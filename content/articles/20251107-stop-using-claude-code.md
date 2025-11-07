+++
title = "LLM: Stop using Claude Code"
description = "My feedback after years of Copilot and months of Claude Code"
date = 2025-11-07
[taxonomies]
tags = ["opinion", "llm", "claude-code", "software-development"]
[extra]
screenshot = "/assets/screenshots/2025-10-28-jean-claude-code.png"
+++

## Be aware

Stop using Claude Code.

I've discovered how to transcend your daily developer experience. How?

With Jean-Claude Code. The only one capable of high-kicking your features into shape.

Here's a way to demystify your worst debugging sessions, add a personalized touch to your audits, and why not, further enhance the experience with voice synthesis.

But, jokes aside, I wanted to share my feelings about using an LLM as a developer.

I've been using Claude Code for several months, and I used Copilot since its beta, before parting ways with it a few years later.

## Github Copilot

Copilot had the merit of significantly speeding up the writing of boilerplate code - the basic, verbose, and not technically critical parts of your projects. It had a strong tendency to invent very practical functions that were absolutely non-existent. Magic code, and often very bad code.

I ended up disabling multi-line suggestions to only keep the current line, as the rest was often way off the mark. Then I eventually stopped using it completely, returning only to the tools provided for my language, my framework, my IDE. The experience lasted roughly two years.

And then, this year, I tried Claude Code, curious but somewhat reluctant given the wave of vibe coding combined with my bad memories of (Github) Copilot.

Spoiler: the experience is conclusive.

## Claude Code

Let's be clear. The current model (Sonnet 4.5) is far from perfect.
It makes mistakes.
It sometimes takes very big shortcuts.
Gets the diagnosis wrong.

Or simply deletes tests I just asked for, because it deems they require too many modifications to work. Hold on a minute. You could have transformed these integration assertions into a series of unit assertions.

It often requires multiple back-and-forths to get the perfect solution.

But for the rest...

Claude Code is capable, with provided context, precise instructions, and a relatively clean codebase, of proposing relevant evolutions, detailed audits of your business code or your test suite, and mentally relieving you on many subjects. A last-minute request, trivial but impactful, with several pieces here and there? Much simpler to handle, rather than searching for occurrences and risking forgetting some.

The UX that a dedicated tool like Claude Code offers is excellent: it doesn't invade your space, doesn't bother you every second, and forces you to review its suggestions as they come. Useful and pleasant code review, you say?

Claude Sonnet is one of the best pair programming assistants you can use, a wise-novice, brilliant but naive, who may not know the specifics of your business needs, and who won't always be the expert in the situation, but who will know how to use your documentation, your ADRs, your fine-grained instructions and your discipline to produce quality work. And all of this, without imposed biological rhythms.

I also think that using this kind of tool is excellent for highlighting cognitive biases and communication patterns, to adopt a more neutral and assertive structure. Directive (paternalistic) communication with an erroneous diagnosis or guidance toward a suboptimal solution will provide mediocre results. Conversely, defining a problem, proposing a diagnosis, having it validated or invalidated, and formulating hypotheses will push the model to consider the problem as a whole, to think outside the box (un-framing) and to propose alternatives to ultimately provide better results.

## Are we all screwed yet?

In short, even though I haven't used MCP yet, I wanted to take stock and answer some questions I regularly see coming up.

Is it still necessary to learn to code in 2025? More than ever. Generative AI is already transforming the work of the individual contributor to bring it closer to that of a decision-maker or an architect, but you will always need the best possible expertise to use it and to understand what you read.

Will AI sign the death warrant of developers? I don't think so. For me, it's undeniable that there will be repercussions on the job market, but not necessarily more than the consequences resulting from rising interest rates and the corporate financing crisis. There will also always be a need for a human to take responsibility for downtime, a regression, or a failed exchange leading to a client's departure (if we go beyond the scope of development).

On the other hand, the opportunities for solopreneurs and very small teams seem immense. As long as we show discipline. And as long as subscription prices don't go through the roof.

Please feel free to share your thoughts on the subject :)

Disclaimer: This article is purely hand-written, but was translated from French to English using a LLM.