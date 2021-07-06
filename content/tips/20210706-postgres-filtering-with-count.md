+++
title = "Postgres: Filtering with COUNT()"
description = "Filtering with COUNT() with PostgreSQL"
date = 2021-07-06
[taxonomies]
tags = ["postgres"]
+++

## Context
Doing a COUNT() in SQL is pretty simple, but sometimes you want to return several counts at once with different filters. To achieve this, you would typically do multiple queries, [optionally with a `WITH` query][0].

Thankfully, there's a way simpler way to do this in PostgreSQL, with `FILTER`.

Let's consider we have a simple table (`racoons`) with a few fields, and we want to return a `caretaker_id`, the total number of racoons taken care by this person, and the number of racoons that have been released to the wilds.

It's as simple as this:
```sql
SELECT   r.caretaker_id,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE released = true) as released
FROM     racoons r
GROUP BY r.caretaker_id;
```

[This page][1] has a bit more information, especially if you're working with a PostgreSQL database prior to 9.4.

[0]: https://www.postgresql.org/docs/9.1/queries-with.html
[1]: https://kb.objectrocket.com/postgresql/how-to-use-the-filter-clause-in-postgresql-881
