# AI Usage Log & Reflection Report

**Tool used:** Claude (Anthropic) via Claude Code  
**Approach:** Option A  Built from scratch with AI assistance

---

## 1. How the AI Tool Was Used

I used Claude as a coding assistant while building this project. Mostly I would describe what I was trying to build in plain english and it would give me a starting point. For example when I was setting up the microservice structure I wasn't sure how to split the responsibilities so I asked Claude to help me think through it. It gave me a rough idea and I went with it after tweaking things.

I didn't just copy paste everything  I had to read through the code it suggested and a lot of times it missed things specific to my use case so I had to go back and fix those. The back and forth was actually kind of useful for understanding things better.

---

## 2. Example Prompts Used

1. "I want to build a barter platform where people exchange services, not money. What would be a good microservice breakdown for this?"
2. "Write an express route for creating a swap proposal  the user offering must own the listing they're offering"
3. "My swap service needs to update the listing status when a swap gets accepted, how do I call another microservice from within a route handler"
4. "The rating system should calculate a rolling average, not replace the old rating  fix the user service patch route"
5. "Why is my axios call from swap service to listing service failing with 401 even though I'm passing the token"

---

## 3. What AI Generated vs. What I Wrote Manually

| Part | AI Assisted | Written Manually |
|------|-------------|-----------------|
| Mongoose schema structure | Suggested fields and types | I changed field names to match my domain, added the status enums |
| JWT middleware | Generated the basic verify function | I adjusted it to decode userId and name both since I needed both downstream |
| Swap proposal route | Generated the base logic | I added the duplicate swap check and the ownership validation |
| React pages layout | Generated component structure | I reworked the dashboard layout and the swap proposal flow felt off so I rewrote that part |
| API gateway proxy config | Suggested express-http-proxy setup | I fixed the path resolver since it was stripping the route prefix wrong |
| Tailwind theme config | Suggested color palette | I picked the orange/black/white scheme myself |

---

## 4. Reflection: Did AI Help or Hinder Understanding?

Honestly it saved a lot of time on the boilerplate stuff  setting up express servers, mongoose connections, cors, all that repetitive stuff I've done before but still takes time. Where it got tricky was the inter-service communication part. Claude gave me a working solution but I didn't fully get why the Authorization header wasn't being forwarded through the gateway at first. I had to actually read the express-http-proxy docs myself to understand what was happening.

It helped more than it hindered but I think if I had just blindly used everything it generated I'd have missed a few bugs. The swap conflict check for example  the first version Claude gave didn't account for swaps that are already in-progress, only pending ones. I caught that while testing and had to update the query.

---

## 5. Issues Encountered Integrating AI Output

**Cross-service token forwarding:** When the swap service calls the listing service to update status on accept/complete, the JWT wasn't being passed correctly. Claude's first version called the listing service without attaching the auth header, so listing service was rejecting it with 401. I had to pass `req.headers['authorization']` explicitly in the axios call.

**Swap conflict check was incomplete:** The duplicate swap check only looked for `pending` status swaps initially. A listing that already had an `accepted` swap could still receive new proposals. I updated the query to include `in-progress` as well.

**Frontend token expiry handling:** The axios interceptor Claude wrote redirected to `/login` on any 401 but this was also firing on page load before the token was even set in headers. Had to check localStorage first before setting the default header in the auth context.

---

## 6. What I Learned from Debugging AI-Generated Code

The biggest thing I learned is that AI generates code that works for the happy path but misses edge cases. The swap ownership check, the duplicate prevention, the token forwarding  all of these were technically correct but incomplete. I had to think through "what can go wrong here" for each route which actually helped me understand the logic properly rather than just having it work.

Also I got more comfortable reading mongoose queries. I didn't know `$in` operator well before and fixing the conflict check query made me look it up properly.

---

## 7. Prompt Log (Sample)

| # | Prompt | What was generated | Did I modify it? |
| --- | --- | --- | --- |
| 1 | "Help me design the barter platform microservice split" | Architecture with 4 services + gateway | Yes  renamed services, changed port assignments |
| 2 | "Write the swap proposal POST route" | Base route with listing lookup | Yes  added ownership check and duplicate swap query |
| 3 | "User service rolling average rating patch route" | Simple replace logic | Yes  rewrote to use weighted average formula |
| 4 | "React dashboard page with stats and recent listings" | Working page but layout was off | Yes  restructured grid and added pending swaps highlight |
| 5 | "Why is listing service returning 403 when called from swap service" | Explained the issue and fixed axios call | Minor tweak to header forwarding |
