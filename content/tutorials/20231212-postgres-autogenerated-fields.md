+++
title = "Postgres: Using SQL generated columns"
description = "A brief introduction to SQL autogenerated fields with Postgres."
date = 2024-01-30
[taxonomies]
tags = ["postgres"]
+++

## Context

**Attention: This feature isn't specific to PG, but that's the only RDBMS I use on a regular basis, so variations may apply.**

> TL;DR: You can define a field generated at row insertion, instead of inferring a dynamic value.

When designing your data model using a relational database, you might encounter a case where you'd need to link a table to numerous other tables.

In that case, you might be tempted to use a polymorphic association, but this comes at the cost of sacrificing data integrity with the loss of foreign keys.

One simple alternative consists of having one foreign key per relation. It is simple and reliable, at least until you reach a large number of foreign keys.

Let's say we have the following schema:

```
items       
----        todos   
id          -----   
todo_id --> id      posts
...         title   -----
post_id ----------> id
                    title
```

We might want to know the "type" of relation our row is linked to, without having to use a case-when statement on each SQl query, which would be costly - and/or at least inefficient.

How about adding a string field representing the relation type? It's fine. But our model may change, and we might have to declare a new type, and yet forget to add the new possible value.

This is a situation where SQL generated columns can be handy.

## Usage
A generated column is typically created like this:
```sql
ALTER TABLE $TABLE_NAME ADD COLUMN $FIELD_NAME $FIELD_TYPE GENERATED AS (
  $GENERATION_EXPRESSION
) STORED;
```

A few key points here:
* `$GENERATION_EXPRESSION` can be any statement returning a value,
* Postgres only supports stored values.

So, in our case, the field definition would look like this:
```
ALTER TABLE items ADD COLUMN relation_type string GENERATED AS (
  CASE
    WHEN 'post_id' IS NOT NULL THEN 'post'
    WHEN 'todo_id' IS NOT NULL THEN 'todo'
  END
) STORED;
```

## Implications

### Introducing new foreign keys
You may need to introduce new foreign keys. In that case, you'll need to alter the table again and add a new condition to your generator expression.

You might be tempted to add a default "unknown" value, but I think explicit failure should be prefered in that case.

### Testing
Since we basically have an enumeration, we might want to iterate over this enumeration in our tests, so that we can check that our codebase actually handles all the possible values it can take (eg. for exposing values on a GraphQL API).

And it turns out we can retrieve that information from Postgres!

```
SELECT generation_expression
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name   = 'items'
        AND column_name = 'relation_type';
```

This will return the raw SQL statement used to generate new values. It's a bit sketchy, but you can parse this expression with simple regexps and extract what you need.

## Conclusion
Generated fields are a simple but powerful tool, and you can use it in a lot of scenarios I didn't mention, such as generating a tsvector for full text search, or simplifying basic yet cumbersome checks.