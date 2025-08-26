+++
title = "Management: Burn your team in six months"
description = "A guide to burn-out"
date = 2025-08-26
[taxonomies]
tags = ["opinion", "management", "leadership"]
+++

## Context
After more than a decade of software development in professional contexts, I've seen numerous behaviors in the teams I have worked in or have worked with, sometimes directly experiencing some of them with my CEOs, CTOs, engineering managers or tech leads.

The patterns I will describe do apply to software development teams, but I believe they do apply to any work environment that involves management and teams, or even business to business relationships. I'll give a lot of examples centered around software engineering though, to avoid beeing too abstract.

## Disclaimer
Writing this article addresses two needs:
* The need to put some thoughts on paper and stop thinking about them, and,
* Leverage this as an opportunity to become a better leader or manager myself; experiencing and noticing bad behaviors is as instructive as reading a training book, and I'm sure I demonstrated some of those behaviors myself.

Being aware of issues is the best way to detect, avoid or fix them in the future. And no, I'm not quoting Thufir Hawat :-)

Also, this is absolutely not a critique against my current employer. I'm also not targetting individuals themselves, but individual behaviors that can hurt productivity or mental health. Finally, my opinions are mine and do not reflect any third parties' opinions I have or currently am working with.

Lastly, this will be a mixed bag of leadership and management issues.

So, now that the frame has been set, how do you burn your team in six months? Where do you start?

## A guide to burn-out

### Sink your team under hours of pointless meetings and reportings
One of the best things you can do is to schedule a lot of meetings. Bonus points for stand ups that last 45 minutes. Bonus point if you're a slow speaker that never pauses, blocking others from reacting to what you say. Bonus point if you spend a lot of time talking about this country house you're repairing.

Even better: schedule loose daily meetings, with no specific beginning or end or topic, and make others adapt to your schedule, so that they cannot start focusing on their own work. And take your personal phone calls during those meetings.

Try to schedule daily reportings, such as KPIs for Sales. Bonus point if they have to reach the tech team to get their numbers. Bonus point if they spend more than two hours a day making slides for the next day.

Meetings should be short, have a purpose, a specific start and end time, and be organised between teams that can take actions to solve issues. There's no point in putting tech performers in sales meetings 30 minutes a day every day.

Your team shouldn't take 25% or 40% just making reports.

### Give weak instructions, have high expectations
Whether or not you're a fan of AGILE or KANBAN, your work will be divided in small units of work, and whether or not you call them tickets or something else, any unit of work must *at least* contain a short description about **what** must be done. Well-made acceptance criteria for features are even better, because they describe a context, an event and an expected result.

Giving enough context and instructions can be very time consuming. In that case, the person in charge of this task can submit a draft for what they're going to do, and request comments from their manager before starting the task. It can be even better this way, because the performer can inspect what's already there and draft specs more accurately.

So, what's the worst thing to do here?
* Write empty tasks with vague titles, or scratch "Build a Back-Office" on a napkin.
* Ignore review requests on business and technical specs.
* Use work review to complain that X or Y feature ie missing.
* Use work review to question the reason behind this task.
* Put the responsibility on the performer for the delay.

### Do not follow your own rules
Theere is a book called "The Art of War" from Sun Tzu. It is very short and quite easy to read, and often quoted in personal development lectures. It is sometimes also mocked because, as some people say, it states the obvious, such as "Don't let your men starve", or statements like this.

This is **wrong**. No matter how often a subject will be discussed, nothing is ever too obvious. And there's a specific teaching from the book that applies to any leader: leaders lead by example.

And they also make sure their men are fed, and they themselves eat last, but this is not a lecture about charisma :-)

In a management context, this means that any rule you force your team to follow, you have to follow it yourself.

You require code review on any pull request that they will open? Fine. Then at least open a pull request for your own work too. Do not push directly on the main branch, break the CI and then complain to them that their pull request "broke the tests". If you do not have a developer role, this, of course, does not apply to you.
But being a CTO doesn't erase the responsibilities of a Developer role when you do developer tasks.

You allow yourself to work remotely? Fine, as long as it applies to your team too. Do not schedule bullshit meetings at 7PM in the office, while you're baby-sitting your kid on your lap, half listening to a report that you might as well read yourself.

### Be the bottleneck of your own team
One of the best quality of a manager (or of a hands-on engineering manager) is being able to delegate work and give directions.

What's the worse that can happen?
* Considering that you're the only one able to get things done correctly.
* Using your veto on any decision, inside or outside of your team.
* Get yourself overwhelmed.
* Delay others' work further because you want to check everything.

### Ignoring other people's time, work or input
After a few studies, we now know that multi-tasking is pretty bad for your brain, and for your mental health.
We also know that anyone will keep thinking about something if they do not consider that this thing is done and behind them.

So, what can we do about that, as a tech lead or similar role?

Well, we can task somebody to do something, and force them to rewrite everything after a few days, by sneaking up a pull request during the night that completely changes parts of the codebase, and we can even blame the delay on them. Bonus point if we slip a little "We should use another library and drop the old one while doing this task" once this task is nearly done.

We can also do pointless code reviews, ie. making people format their code manually, following arbitrary rules not enforced by the formatter. Even better if those code reviews are meetings.

We can give them never-ending tasks, transforming a simple MVP draft into a moving target that keeps changing and being more complex.

We can also put all of our ego into the codebase, arguing about the tiniest change, blocking a big merge for one thing that we don't like, but that won't affect production, forcing the person in charge to delay other tasks on the sprint's last day, just because we can't accept improvements, even if they come as soon as the next sprint's first day, and even if they're the best option to pick.

We can of course, make somebody work on something, and having them re-do everything because we do not like the shape of it. Bonus point if we do an infinite number of reviews, and even better if a review voids the last review changes.

And of course, we can require code review on pull requests while our own schedule do not allow it, delaying them and making the performer go back to tasks he did three weeks ago. Bonus point if the changes are about changing "lorem ipsum" to "ipsum lorem".

The request "Please make another ticket" is not a mark of laziness. I mean, sometimes, it can be. But there are good reasons to shape something, to consider it *not perfect*, but *good enough*, and to improve it with iterations. Especially if a first version has been manually tested. You don't want to risk regressions because new feautres popped in after QA.

Working in a company with uncertain funding or market fit is a lot about timing, tests, quick (and stable) prototypes that you improve, and listening to your team is also important.

### Denying reality
There's nothing worse for a leader than denying reality about the market he's trying to enter in, or about the financial status of his own company.

The leader is the ship's captain. If your team feels numbers aren't good, and your only response is to hide metrics on the next week slides, not discussing measures, or in general, not mentioning the elephant in the room, then your team anxiety level is going to increase, significantly.

Working in a startup is hard. From my humble experience, leading small teams is even harder.  But ignoring the hole in the ship's hull is not going to help.

### Bitching about others and denying responsibility
It is certain that a shortage of funds and treasury can damage a company (or even a person) in many ways. And people can indeed demonstrate skill issues, or take actions that will have deep negative consequences.

But the worst thing somebody can do is bitching about others, whether they're still in the company or have been fired, or *encouraged* to leave, or whether they can even hear you in the next room.

Everybody makes mistakes, except people doing nothing, and while there's no point in blaming yurself forever for something you did, you should always acknowledge that you did that mistake. No need for humiliating speeches in front of 300 people, just a simple statement such as: "Ok, I did this [because I thought this], it didn't go well. Now, here's how I plan to fix it.".

Do not blame a junior account manager sending a few hundreds to the wrong bank account, insulting them in the next room, while you do not take responsibility for your own implementation that makes the company lose money by the thousands on a monthly basis.

Also, do not blame a performer for the time a feature took, if you were one of the bottlenecks behind it, whether by lack of time or planning.

## Wrapping up
I'm in no way considering myself a good manager. I'm pretty sure I did a lot of mistakes when I had to manage a team myself, and I'm pretty sure the pressure is even worse when you build a company and put your time and energy behind it.

So, what makes a good manager or startup leader? I'm definitely not sure about that, but I do have a few ideas:
* Be trustful.
* Be respectful. Always. If you have complainings, go to the person and tell them about it, do not bitch over somebody else's shoulder at ear's distance.
* Listen to your team.
* Take responsibility when necessary.
* Allow others to fail and take accountability, don't be the gatekeeper to everything.
* Do not delay hard decisions.
* Keep the long personal stories for the coffee breaks and afterworks.
* Finally, feed your soldiers and eat last.

Of course, I do not pretend to be the guardian of truth, and I would be more than happy to get feedback, and to hear from you in the comments section, or on the various social medias I will link this article from.
