+++
title = "Rails: Deprecate an ActiveRecord attribute"
date = 2020-08-15
[taxonomies]
tags = ["tip", "rails"]
+++

## Context

When working on a growing application relying on a database, it is not uncommon to have a data model that collects dust: some of its data may become obsolete, but you may not want to delete it just yet, because you may need to migrate it, prepare its deletion later or keep it as history.

You might want to flag this data as deprecated, so that no one (including you) would rely on this no longer updated or relevant data.

## How

You could of course add comments in your code, but there would be no guarantee someone would check those comments before using those attributes. Also, you wouldn't notice anything if existing code would use those attributes indirectly.

Fortunately, Rails provides [a nice way to flag ActiveRecord attributes as obsolete][0], stabilized since Rails 4.x.

Let's create a `Deprecator` class, that'll embed any behavior we'd like to implement. We can be creative here, like:

- logging the action
- logging parts of the stacktrace
- shaming your coworkers on Slack with a bot message

But let's keep it simple for the time being:

```ruby
# app/deprecators/field_deprecator.rb
class FieldDeprecator
  def deprecation_warning(field, replacement, _caller_backtrace = nil)
    message = "#{field} is deprecated, please favor #{replacement}"
    Kernel.warn message
  end
end
```

We're not respecting the semantics of the second argument, but hey, this is duck-typing :trollface:

Then, all we have to do is to add a call to this class method in our model:

```ruby
class Racoon < ApplicationRecord
  deprecate \
    owner_id: 'Racoon#caretaker_id',
    # ... any other attribute you need to deprecate.
    deprecator: FieldDeprecator.new
end
```

With our current deprecator, this would output a warning message everytime this field is being read and updated:

```
> Racoon.first.owner_id
owner_id is deprecated, please favor Racoon#caretaker_id
```

_Et voilà._

[0]: https://apidock.com/rails/v4.0.2/Module/deprecate
