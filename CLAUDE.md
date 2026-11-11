# Yt Pass: content rules

This repo stores the channel's short videos (`videos/`). Every new video must follow these rules.

## Audience
- Target viewers: **USA first**, then UK, Canada, Australia (high-CPM English markets).
- The creator lives in Germany. Never fake location or channel country; targeting is done through content only.

## Language and references
- American English only: "mom", "fries", "apartment", "soccer", "color".
- US units and money: miles, feet, °F, pounds, dollars ($).
- US settings and culture: high school, college, Walmart-style stores (no brand names or logos), Thanksgiving, prom, road trips, gas station, school bus, dorm.
- Avoid German or European references unless a topic explicitly needs them.
- Voice: American voices (Kokoro `am_michael`, `am_adam`, `af_heart`). No British voices.

## Format
- Vertical 1080x1920, 20 to 40 seconds, hook in the first second, loopable ending when possible.
- Captions always on (many people watch muted).
- Original characters, scripts, and jokes only. No copyrighted characters, music, or existing memes' mascots.
- Vary the formats and styles from video to video. YouTube can demonetize channels that mass-produce near-identical templated videos ("inauthentic content").

## Formats (rotate: never the same format two days in a row)
Each day, pick the next format in this order, continuing from the last video in the README table, and skip any format used in the last 3 videos (after 9, wrap around to 1):
1. **Universe battle / "Who would win"** with characters from `characters.md` (or absurd matchups like "1 million chickens vs 1 gorilla"). End with "Comment who fights next". Log it in `series.md`.
2. **Cursed "facts" explained dead seriously:** deep documentary voice (`am_onyx` or `am_fenrir`), obviously fictional lore ("The pigeon was invented in 1987"). Must be clearly absurd. Never about real people, real tragedies, health, elections or anything a viewer could believe and act on. Description says "100% real facts (not real)".
3. **POV first-person comedy:** "POV: you are the last chicken nugget in the box", "POV: you are the Wi-Fi at grandma's house".
4. **Brain rot quiz:** "Only 1% can find the odd one out", "Which door do you pick". Answer revealed at the end, loopable, correct answers only.
5. **Soap opera episode** "Zero IQ Club: The Kitchen Wars, Part N": continues the story in `series.md`, ends on a cliffhanger, update the log.
6. **Rating things on a scale that makes no sense:** "rating fruits by how likely they are to commit tax fraud". Never mock real nationalities, ethnicities or religions.
7. **Original storytime split-screen:** our own written absurd story on top, our own animation underneath (a looping animated mini-game or satisfying animation we render ourselves). Never use game footage, other people's clips or stolen Reddit stories.
8. **"Why is X shaped/made like that?" story explainer:** a real fact told as a mini drama with a rival and a twist (like the manhole video). Facts checked against sources.
9. **"What if" hypothetical** (like the bro / like videos).

Character universe: `characters.md`. Running series: `series.md`.

## Growth rules (goal: subscribers and watch time)
- **Style per format:** 3D world (engine in `sources/manhole3d/`) for format 8 and for big "who would win" finals; 2D stick-figure engine for everything else (richer acting, fast).
- **First second decides everything:** open on the most extreme moment of the video (the crash, the punchline image), with a 2 to 4 word on-screen title for the first 1.5 s. Never open on a calm establishing shot or a logo.
- **Loop it:** write the last line so it flows back into the first line, so the Short replays seamlessly (rewatches count as watch time).
- **Length:** 20 to 35 s is the sweet spot; cut any line that doesn't push the story.
- **Recurring characters and series build subscribers:** use `characters.md` characters in most videos; series videos end with "Part N+1 tomorrow" on screen (no begging for subscriptions anywhere else).
- **Comments:** every upload file includes a **pinned comment** that asks a question viewers want to answer ("Who wins: Toastzilla or Microwave Monk?").
- **Playlists:** every upload file names a playlist ("Who Would Win", "Cursed Facts", "The Kitchen Wars", "Why Is It Like That?", "What If", "POV", "Quizzes", "Rated").
- **Related video:** every upload file says which long video or Short to link as the Short's "Related video" (the newest weekly compilation, or Part N-1 for series).
- **Weekly compilation (Sundays):** the week's Shorts joined into one long video (16:9, blurred background), so watch hours also count toward the long-video monetization path.

## Animation quality (required on every video)
- **Lip sync from the voice:** mouth opening follows the voiceover loudness (amplitude envelope), never a timer toggling between two shapes.
- **Characters never stand still:** idle breathing/bob, random blinks, head tilts, and a hand gesture on stressed words.
- **Hits land on the body:** anticipation before, squash and stretch on impact, recoil after, plus screen shake and flash.
- **Physical comedy is shown, not implied:** if a character bonks a door, he walks into it; if an object wins, it acts on him.
- **Visible stakes:** show the "meter" (IQ, money, health) on the character too, e.g. a brain above the head that shrinks or cracks.
- **Varied locations:** at least 3 different settings per video (bedroom, school hallway, kitchen, street, store...), with background characters reacting where it fits. Do not reuse one room in different colours.
- **Hands are drawn as hands** (palm + fingers) when touching the face or holding things.
- Before the full render, show still frames of the busiest moments and fix them.
- Render at 1080x1920, 30 fps (fast to iterate); the 1440x2560 / 60 fps upgrade only if asked.

## Topics that travel well in the US
- "What if" absurd hypotheticals (school, money, phones, food, sleep).
- Relatable school / work / gaming / internet life.
- Weird true facts (check every fact against a source; hedge theories).
- Money and numbers visuals ($, salaries, prices) with clear, correct figures.

## Every upload: hand over with
- Title (under 60 characters, curiosity-driven, no clickbait lies).
- Description (2 lines, 3 to 5 hashtags including #shorts).
- Suggested upload time: 18:00 to 21:00 German time (12:00 to 15:00 US Eastern).
- Add the video to `videos/`, thumbnails (vertical 1080x1920 + 16:9 1280x720) to `thumbnails/`, an upload file (title, description, settings) to `uploads/`, and a row to the table in `README.md`.
