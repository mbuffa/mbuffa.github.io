+++
title = "Elixir: LiveView + Stripe + Mobile"
description = "a few things you should be aware of"
date = 2025-12-18
[taxonomies]
tags = ["tip", "elixir", "phoenix", "liveview"]
+++

## Context
I recently had to integrate Stripe into an existing LiveView application used by a few customers in production. I was already quite accustomed to Stripe, but it was a while since I implemented a flow from frontend to backend, and the first time I had to do it inside a LiveView app, moreover, an app receiving async events from another service through a message broker.

There were a few difficulties that appeared along the way, and I wanted to register and share them to anyone who would eventualy have to work on this kind of topics. Or to my future self.

## Setup
I won't be revealing too many details about the project itself, but the app was basically using LiveView, which was also receiving async events from another source. Stripe.js and a backend client to communicate with Stripe, as well as a custom Stripe form built with Stripe Elements. A couple of hooks from myself would be added to initialize the Stripe Elemments correctly and handle the back-and-forth between backend and frontend. Stripe uses both public and secret keys, because Stripe.js is only allowed to do a subset of the things your backend will be able to do, plus a few other things that only a frontend is supposed to do, like submitting card details to Stripe.

## WebSockets. And Mobile.
Let's start with the latest and the most critical issue I encountered, since the app was already live when it was discovered, and had to be patched quickly.

### WebSockets
LiveView relies on WebSockets, an active connection between a browser and a server that allows sending data both ways. LiveView uses it to send events to both sides, as well as DOM updates.

One thing I knew was that LV does not handle slow clients very well, and even with a small page, latency can really kill your user experience, making your whole application very laggy and losing state with too much back-and-forth between your backend and frontend. This is not the end of the world though, and you can easily workaround this by debouncing your UI elements (eg. you do not send immediate key stroke events from your inputs), or use more simple JS-based UI components for everything that doesn't need to be tracked by the backend. I covered the former in a previous article, and I believe DaisyUI would be the perfect fit for the latter.

### And Mobile
But the thing is that LiveView is also very affected by the unstable nature of mobile networks, so I knew I had some mitigation to put in place if users would wish, for example, to be able to use the app in, let's say, public transports.

What I didn't know however, was that WebSockets can be very, very quickly killed by just swiping to another application, on older devices, every time. And that is probably aggravated by energy saving mode.

So, what if you're on a payment form, entering your details, and switching to your banking app to authorize the transaction?

Boom.

### How to fix this
The most reliable, yet not the most simple way to fix this issue was to implement a frontend cache using the browser's Session Storage. When going back to their browser, LiveView's JS would timeout, reconnect and create a new process (representing the LiveView) on the server. State would be cleared, but the cache stored in the Session Storage would be picked up, so that an additional Javascript hook would be able to send a message to the backend, do some transactional stuff, and redirect the user accordingly.

It took me a bit (two full days) to get this right and to "integrate" that cache resolution in a reasonable way, making sure the UI wouldn't allow the user to take any additional action, and to make sure all edge cases were covered.

LiveView is great, but I'm not sure it is the perfect fit for such an app, even though it probably simplifies things too when you have to also receive messages from a broker and propagate it to a UI. Also, admittedly, I know a couple of "regular" (React) frontend developers that wouldn't want to bother with mobile browsers, and redirect users to a native mobile app, so I think this is not a liked topic overall.

If I had to rewrite or adapt it, I would probably try to be the most "low tech" as possible for this, with the possibility of replacing the sensitive parts ofd the app with plain Phoenix templates, and, maybe, Inertia + React.

## Get me hooked
As a reminder, a basic LiveView hook look like this:
```js
var hook = {
    mounted() {
        // You can execute some code here.

        this.handleEvent("event", (payload) => {
            // You can send events back to the backend:
            // this.pushEvent("event-response", {})
        })
    }
}
```

This is a "glue", and it is essential when you have to send messages between frontend and backend and when you need some form of JS interoperability (calling the browser API).

But you have to keep in mind that your HTML gets rendered progressively, once your `mount/3` callback in your backend has already been called once. So, If you're, for example, sending a request from a server and waiting for the response to send it to your frontend using `push_event`, you may face a race condition situation: Your LiveView pushes an event, but your hook isn't ready to handle it yet, and it's lost into abyss.

There are several things you can do to avoid that.

First, you could try to place your hook "upper" in your templates. If your hook isn't tied to a specific page, that may be completely fine.

Another thing I tried to do was to keep the hook where it was supposed to be, and added a "root" event listener on top of my Javascript, which would intercept the message, and try "pass" the event to the hook using a Promise, with a retry mechanism that would keep trying until the hook was ready.

I felt very smart at first, but this was a very overkill, unreliable, and pretty stupid piece of code that I eventually just replaced with DOM.

As a general advice, I think it is much better to rely on LiveView's capability to track changes on socket assigns, and to pass the relevant arguments you want to pass to your components by using `data-` attributes, or equivalent. For instance:
```html
<!-- LiveView -->
<div>
    <.LiveComponent />
    <.LiveComponent>
        <.LiveComponent /> <!-- You want to pass one of the LV assigns here. -->
    </.LiveComponent>
    <.LiveComponent />
</div>
```

You can just pass data using `data-` attributes. That's what they've been made for. You should use `push_event` only if you don't want the target component to not re-render completely.

And this of course applies to events your LiveView would receive from Phoenix PubSub: just update your socket assigns, do not push an event while your DOM may not be ready.

## Stripe specificities
One final issue I wanted to mention is that Stripe seems to set a couple of safety measures in place to protect the end-user. When you use Stripe Elements, you basically end up with one `<iframe>` for each form element you include (if you're not using a prebuilt form), and Stripe.js uses promises to make the communication happen between your Javascript, and the iframe's Javascript. Those promises can fail if you happen to, for example, put a loder modal with a high Z index.

If you want to warn your user that a background processing is taking place, then you probably want to disable and alter the submit button, and avoid modals entirely.