/* =========================================================
   PRINTORIA — Hero product waterfall
   Renders real product photography (transparent PNG cut-outs)
   and animates it in columns inside #hero-waterfall on the
   homepage.
   ========================================================= */

(function(){
  /* Real product photography (transparent PNG cut-outs). */
  function photo(src, alt){
    return `<img class="wf-photo" src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  }

  /* Product library — real product photography (transparent PNG cut-outs)
     showcasing PRINTORIA's current catalog. Indices are referenced below
     so each hero column can mix different product types together. */
  const LIB = [
    () => photo("assets/products/tee-lucky-green.png", "Forest green t-shirt printed with a 'Lucky, good things take time' design and a shamrock"),
    () => photo("assets/products/tee-skyblue-brush.png", "Light blue t-shirt with a custom printed front design"),
    () => photo("assets/products/tee-black-loudvoices.png", "Black t-shirt printed with a bold 'Loud Voices' design"),
    () => photo("assets/products/mug-valentine.png", "Personalized photo mug with a couple and a Happy Valentine's Day message"),
    () => photo("assets/products/mug-gold-script.png", "Two-tone purple mug printed with gold lettering"),
    () => photo("assets/products/bottle-mountain.png", "White steel water bottle with a carabiner lid, printed with a mountain and starry night design"),
    () => photo("assets/products/tote-canvas.png", "Natural canvas tote bag, ready for your custom print"),
    () => photo("assets/products/phonecase-emerald-leaf.png", "Emerald green phone case printed with a gold leaf pattern"),
    () => photo("assets/products/hoodie-blue.png", "Light blue hoodie with a custom printed front design")
  ];

  const ROTS = [-6,-3,0,2,4,6,-4,3];

  // Small deterministic pseudo-random so the layout is stable across
  // reloads but each card still gets its own drift amplitude/timing.
  function rand(seed, min, max){
    const x = Math.sin(seed * 999.7) * 10000;
    const frac = x - Math.floor(x);
    return min + frac * (max - min);
  }

  // libIndex picks which product image to show; animSeed is a separate,
  // always-unique counter so repeated images (e.g. two mugs filling a
  // 4-card column) still get their own rotation/drift/timing instead of
  // animating as identical clones.
  function buildCard(libIndex, animSeed){
    const svg = LIB[libIndex]();
    const rot = ROTS[animSeed % ROTS.length];
    const wobble = animSeed % 2 === 0;
    const fx = rand(animSeed + 1, 4, 10).toFixed(1);
    const fdur = rand(animSeed + 2, 5, 9).toFixed(1);
    const fdelay = (-rand(animSeed + 3, 0, 10)).toFixed(1);
    return `<div class="wf-card" style="--fx:${fx}px;--fdur:${fdur}s;--fdelay:${fdelay}s">
      <div class="wf-inner ${wobble ? "wf-sway" : ""}" style="--r:${rot}deg">${svg}</div>
    </div>`;
  }

  function buildColumn(stage, indices, seedOffset){
    const col = document.createElement("div");
    col.className = "wf-col";
    const track = document.createElement("div");
    track.className = "wf-track";
    // Duplicate the sequence so translateY loops seamlessly.
    const cards = indices.map((libIndex, i) => buildCard(libIndex, seedOffset + i)).join("");
    track.innerHTML = cards + cards;
    col.appendChild(track);
    stage.appendChild(col);
  }

  function initHeroWaterfall(){
    const host = document.getElementById("hero-waterfall");
    if (!host) return;

    const stage = document.createElement("div");
    stage.className = "wf-stage";
    host.appendChild(stage);

    // Every product appears exactly once across the whole waterfall — no
    // repeats — while each column still mixes different product types.
    buildColumn(stage, [0, 3, 5], 0);   // tee-lucky, mug-valentine, bottle
    buildColumn(stage, [1, 4, 6], 10);  // tee-skyblue, mug-gold, tote
    buildColumn(stage, [2, 7, 8], 20);  // tee-black, phonecase, hoodie
  }

  document.addEventListener("DOMContentLoaded", initHeroWaterfall);
})();
