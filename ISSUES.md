# Issues

## Clicking on the last item of the Table of Content breaks scrolling
### Reason
It moves display past hidden overflow.

### Impact
Scrolling up doesn't fix this, and one must click on another anchor or go to previous history to be able to see the navbar again and hide the bottom div.

### Resolution
I don't know yet. I tried applying a margin-bottom on both `footer` and `article`.

## Table of Contents broken on mobile
### Resolution
ToC should collapse and displayed before content.
