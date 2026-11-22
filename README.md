# Four Question Fluency

A classroom web app that shows four GCSE Maths fluency questions on screen, one per quadrant.
When it opens, it asks what topic should go in each quadrant. It then makes random questions for those topics, with answers you can reveal.

## Using it

Open `index.html` in a browser. There is no build step and no server. You can also host the folder on GitHub Pages.

1. Choose a topic for each quadrant (top left, top right, bottom left, bottom right), or pick **🎲 Random topic**.
2. Choose 1–3 questions per quadrant, and whether topic names appear on screen.
3. Press **Show questions**.

| Action | Button | Key |
| --- | --- | --- |
| Show / hide all answers | Show answers | `A` or `Space` |
| Show one quadrant's answer | Answer (in that quadrant) | `1`–`4` |
| New numbers in one quadrant | ↻ (in that quadrant) | |
| New questions everywhere | New questions | `N` |
| Change topics | Topics | `T` |
| Fullscreen | ⛶ | `F` |

There is also a countdown timer (1–10 minutes) and a light/dark switch.

**Sharing a set:** the chosen topics are saved in the page address (for example `index.html#q=addFrac,expandDouble,percentOf,pythagoras&n=1`).
Bookmark it or use **Copy link to this set** to reuse a starter. Your last choice is also remembered in the browser.

## Topics

48 topics across Number, Algebra, Ratio & proportion, Geometry & measures, and Statistics & probability.
Higher-tier topics are marked *(Higher)* in the list. All topics live in `js/questions.js`.

## Adding a topic

Add a `topic(...)` call in `js/questions.js`:

```js
topic('myTopic', 'Number', 'My topic name', () => {
  const a = R(2, 9), b = R(2, 9);
  return { q: Q('Work out', `${a} ${TIMES} ${b}`), a: num(a * b) };
});
```

`gen()` returns HTML for the question (`q`) and answer (`a`). Then run the checks:

```sh
node tests/generators.test.js
```

The script runs every generator 2,000 times and checks for errors, `NaN` or `undefined` in the output.
