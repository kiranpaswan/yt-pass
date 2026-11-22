def screech(dur=.6):
    n = int(dur * SR); t = T(n); f = 1800 - 600 * t / dur
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * .5 + hp(rng.standard_normal(n), 2500) * .3) * np.exp(-t * 2) * .5
def train_rumble(dur):
    n = int(dur * SR); t = T(n); x = lp(rng.standard_normal(n), 200) * 1.5 + np.sin(2 * np.pi * 55 * t) * .4
    return x * np.sin(np.pi * np.clip(t / dur, 0, 1)) * .6
place(sfx, thud(70, .4, 1), 0.02); place(sfx, crack(), 0.02, .4)
for i in range(4): place(sfx, pop(500 + i * 120), 1.7 + i * .2, .35)
for w in [3.1, 9.75, 13.15, 19.3, 22.2, 25.25, 28.85]: place(sfx, whoosh(.36), w - .22, .3)
for i in range(4): place(sfx, ding_up(), 6.3 + i * .55, .25)
place(sfx, scribble(.6), 5.6, .3)
place(sfx, engine(2.6) if 'engine' in dir() else whoosh(.8), 10.2, .3)
place(sfx, boing(300, .3), 12.3, .35)
place(sfx, bell(), 15.0, .35); place(sfx, bell(), 15.5, .35)
place(sfx, train_rumble(2.6), 15.3, .8)
place(sfx, sparkle_sfx(), 18.6, .35)
place(sfx, stampfx(), 21.8, .6)
place(sfx, ding_down(), 24.0, .4)
place(sfx, pop(800), 25.4, .4); place(sfx, splash(), 27.45, .6); place(sfx, sparkle_sfx(), 27.6, .4)
place(sfx, screech(.6), 27.7, .3)
place(sfx, boing(180, .5), 32.6, .4)
#MUSIC
playful(0, 13.15, DMAJ, .7, glock_on=False)
sneak(13.15, 19.3, .7)
playful(19.3, 25.25, DM, .6, glock_on=False)
playful(25.25, DUR - .3, DMAJ, .8)
