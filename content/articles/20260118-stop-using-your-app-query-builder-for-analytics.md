+++
title = "Stop using your app query builder for analytics"
description = "There are better alternatives."
date = 2026-01-18
[taxonomies]
tags = ["opinion", "sql", "analytics"]
+++

## Context
A few years ago (in 2022 I believe), I had a disagreement with an interviewer debriefing one of my take-home assessment. We were discussing the usage of raw SQL in a codebase, and I believe my position cost me the role (or, alternatively, the way I expressed my disagreement did).

We were basically arguing over a query that was doing a bit of filtering, grouping, and formatting data. This query took no parameter, and considering the query was used to extract analytics, I decided to go for raw SQL.

This is relatively easy to do with many frameworks, and it's [straightforward in Elixir with Ecto][0].

I think I also failed at expressing stronger arguments at the time other than "You don't need the added complexity of an ORM, for a simple query without arguments." and if I recall correctly, the person I was talking to was just saying "it's safer".

I did a bit more work related to analytics since then, and I gathered stronger arguments. I'll keep it short, but here they are :)

### Your app query builder is another layer of complexity
This is literally another DSL on top of another DSL (which is, in this case, SQL).

A DSL is a system, and each system comes with some overhead, the possibility of oversights (such as N+1 queries) and bugs related to the library.

It also comes with limitations. I recently saw that a PHP ORM didn't have support for the `WHERE x OR Y` syntax for its query builder. I wouldn't be surprised if PostgreSQL's `with` statements weren't supported in some libraries even to this day.

### SQL is the domain language for data queries
A query builder also forces you to `think` using its grammar and semantics, which may be very different than the underlying database language.

Your Database Administrator or DevOps may not know this language, which would be a problem if they had to debug those by themselves.

And finally, you may eventually have or want to switch libraries, or languages, and you would have to port your queries over.

Arguably, you could also have or want to switch to another database, with its own DSL. But I assume this would be less likely to happen, at least for a company's typical "core" records (eg. sales, customers, ...).

### You can do better than writing analytics inside your codebase
I recently worked on a project where we were building a dashboard, with analytics queries written with our ORM.

The flow went this way:
* A developer would write those queries and merge them to the trunk,
* I would try to use them, write tests to check those were valid,
* Potentially reported bugs, and had to wait a bit before the fix came up,
* Had to implement various export modules, without knowing if the output was correct for the business,
* The person doing the QA would report to me, and I would then have to convince the person who wrote the queries that there was a problem there,
* I would then have to adapt my modules to the potentially new format, and adapt all of my tests.

This was totally uneffective. A lot of those queries weren't even tested, and the debugging was painful and slow.

Arguably, some of the things that went wrong could have been avoided by having just one developer do the whole job.

But I think the best course of action would have been to do it this way:
* Take the time to spin up a [Metabase][1] instance (or similar),
* Write queries, **and** validate them on a production replica,
* Validate the output with the QA team,
* Implement a client that would query Metabase's API,
* Implement the export modules.

Boom. Smooth.

And this isn't less safe. Arguably, a bit longer to setup, and that Metabase client may have to be implemented, but this would have been so easier to debug.

Thank you for reading me. Please let me know what you think.

[0]: https://hexdocs.pm/ecto_sql/Ecto.Adapters.SQL.html#query/4
[1]: https://www.metabase.com/