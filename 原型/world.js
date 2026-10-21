/* Canvas scene composition using Kenney CC0 sprite assets. Fixed single-floor maps. */
const Art = (() => {
  const sheets = {};
  const sources = {
    indoor: "assets/indoors.png",
    city: "assets/city.png",
    characters: "assets/characters.png",
  };
  let loaded = false;
  let activeState = null;
  const people = {
    Chris: [0, 7],
    Sarah: [0, 9],
    Mia: [1, 7],
    Emma: [1, 5],
    Daniel: [0, 11],
    Grace: [1, 11],
    Leo: [0, 6],
    Ben: [1, 10],
    Nora: [0, 8],
  };
  async function load() {
    await Promise.all(
      Object.entries(sources).map(
        ([k, src]) =>
          new Promise((resolve) => {
            const im = new Image();
            im.onload = () => {
              sheets[k] = im;
              resolve();
            };
            im.onerror = resolve;
            im.src = src;
          }),
      ),
    );
    loaded = true;
  }
  function tile(ctx, sheet, x, y, dx, dy, w = 16, h = 16) {
    const im = sheets[sheet];
    if (!im) return;
    const step = sheet === "city" ? 16 : 17;
    ctx.drawImage(im, x * step, y * step, 16, 16, dx, dy, w, h);
  }
  function patch(ctx, x, y, cols, rows, dx, dy, scale = 1.2) {
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        tile(
          ctx,
          "indoor",
          x + i,
          y + j,
          dx + i * 16 * scale,
          dy + j * 16 * scale,
          16 * scale,
          16 * scale,
        );
  }
  function avatar(name, canvas) {
    if (!loaded) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    const p =
      people[activeState?.npcs?.[name]?.sprite] || people[name] || people.Chris;
    tile(ctx, "characters", ...p, 0, 0, 32, 32);
  }
  function label(ctx, text, x, y, small = false) {
    ctx.font = `${small ? "7" : "8"}px "DM Sans"`;
    ctx.fillStyle = "#7d826d";
    ctx.textAlign = "left";
    ctx.fillText(text.toUpperCase(), x, y);
  }
  function plant(ctx, x, y) {
    tile(ctx, "indoor", 16, 0, x, y, 20, 20);
  }
  function person(ctx, name, x, y, isPlayer = false) {
    ctx.fillStyle = "#263f3322";
    ctx.beginPath();
    ctx.ellipse(x + 10, y + 23, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (isPlayer) {
      ctx.strokeStyle = "#54715e";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(x + 10, y + 24, 13, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    tile(
      ctx,
      "characters",
      ...(people[activeState?.npcs?.[name]?.sprite] ||
        people[name] ||
        people.Chris),
      x - 2,
      y - 7,
      27,
      32,
    );
    ctx.font = '6px "DM Sans"';
    const profile = activeState?.npcs?.[name];
    const busy =
      profile &&
      ((profile.service === "Sarah" && activeState.docDue) ||
        (profile.service === "Daniel" &&
          activeState.consultStart &&
          !activeState.consulted));
    const text = isPlayer
      ? "You"
      : (profile?.name || name) + (busy ? " · busy" : "");
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = isPlayer ? "#3e6250" : "#fcfaf2";
    ctx.beginPath();
    ctx.roundRect(x + 10 - w / 2, y - 21, w, 12, 4);
    ctx.fill();
    ctx.fillStyle = isPlayer ? "#fff" : "#4f5b47";
    ctx.textAlign = "center";
    ctx.fillText(text, x + 10, y - 13);
  }
  function room(ctx, x, y, w, h, type = "wood", doors = []) {
    ctx.fillStyle = "#30452d15";
    ctx.fillRect(x + 3, y + 5, w, h);
    ctx.fillStyle = "#aaa98d";
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.fillStyle =
      type === "tile" ? "#e4e4d4" : type === "blue" ? "#d5ded5" : "#dfc8a4";
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = type === "wood" ? "#c9b18e66" : "#bfc8bb55";
    ctx.lineWidth = 0.5;
    for (let yy = y; yy < y + h; yy += 12) {
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
      ctx.stroke();
      for (
        let xx = x + (Math.round((yy - y) / 12) % 2) * 14;
        xx < x + w;
        xx += 28
      ) {
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + 12);
        ctx.stroke();
      }
    }
    ctx.restore();
    ctx.strokeStyle = "#f9f2dc";
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    ctx.strokeStyle = "#aaa98d";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    for (const d of doors) {
      ctx.fillStyle = type === "wood" ? "#dfc8a4" : "#e4e4d4";
      ctx.fillRect(d[0], d[1], d[2], d[3]);
    }
  }
  function rug(ctx, x, y, w, h) {
    ctx.fillStyle = "#9fae97";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#d9dfc4";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.fillStyle = "#c2cdb0";
    for (let i = x + 7; i < x + w - 5; i += 5) {
      ctx.fillRect(i, y + 6, 2, 1);
      ctx.fillRect(i, y + h - 7, 2, 1);
    }
  }
  function home(ctx, state) {
    room(ctx, 46, 57, 128, 90, "wood", [[171, 109, 18, 18]]);
    room(ctx, 46, 164, 128, 112, "wood", [[171, 217, 18, 18]]);
    room(ctx, 190, 57, 142, 219, "wood", [
      [174, 109, 19, 18],
      [174, 217, 19, 18],
      [329, 113, 20, 18],
      [329, 232, 20, 18],
    ]);
    room(ctx, 348, 57, 134, 112, "tile", [[330, 113, 21, 18]]);
    room(ctx, 348, 186, 134, 90, "wood", [
      [330, 232, 21, 18],
      [407, 273, 25, 12],
    ]);
    label(ctx, "Bedroom", 55, 70);
    label(ctx, "Mia’s room", 55, 177);
    label(ctx, "Living room", 200, 70);
    label(ctx, "Kitchen", 358, 70);
    label(ctx, "Entrance", 358, 199);
    patch(ctx, 14, 6, 2, 2, 72, 83, 1.5);
    patch(ctx, 4, 12, 3, 1, 47, 127, 0.8);
    plant(ctx, 150, 76);
    patch(ctx, 14, 6, 2, 2, 65, 192, 1.5);
    patch(ctx, 16, 15, 3, 2, 124, 172, 0.8);
    tile(ctx, "indoor", 7, 4, 136, 234, 23, 23);
    tile(ctx, "indoor", 4, 4, 126, 231, 23, 23);
    rug(ctx, 213, 142, 93, 86);
    patch(ctx, 16, 8, 3, 1, 217, 151, 1.5);
    patch(ctx, 0, 0, 3, 2, 226, 191, 0.9);
    tile(ctx, "indoor", 0, 2, 270, 212, 17, 17);
    patch(ctx, 23, 8, 3, 1, 215, 89, 1.2);
    plant(ctx, 303, 80);
    plant(ctx, 197, 248);
    patch(ctx, 16, 16, 3, 1, 270, 256, 0.8);
    patch(ctx, 0, 12, 4, 1, 351, 80, 1.1);
    patch(ctx, 5, 12, 3, 1, 421, 80, 1.1);
    patch(ctx, 3, 0, 2, 2, 394, 123, 1);
    tile(ctx, "indoor", 0, 2, 370, 128, 16, 16);
    tile(ctx, "indoor", 1, 2, 434, 128, 16, 16);
    plant(ctx, 456, 146);
    patch(ctx, 16, 15, 3, 1, 427, 204, 0.9);
    patch(ctx, 0, 12, 2, 1, 353, 205, 1);
    rug(ctx, 398, 254, 38, 16);
    plant(ctx, 456, 250);
    if (state.items.key === "tray") {
      ctx.fillStyle = "#cb9e40";
      ctx.fillRect(360, 211, 9, 3);
      ctx.strokeStyle = "#a97f2d";
      ctx.strokeRect(359, 209, 4, 4);
    }
    if (state.items.id === "tray") {
      ctx.fillStyle = "#f4efe1";
      ctx.fillRect(372, 210, 7, 5);
      ctx.fillStyle = "#8ba899";
      ctx.fillRect(373, 211, 2, 2);
    }
    const p = {
      Entrance: [395, 237],
      "Living Room": [276, 236],
      Kitchen: [443, 138],
      Bedroom: [144, 113],
      "Child's Room": [141, 244],
    };
    drawResidents(ctx, state);
    person(ctx, "Chris", ...(p[state.area] || p["Living Room"]), true);
    label(ctx, "To the road", 389, 298, true);
  }
  function hospital(ctx, state) {
    room(ctx, 46, 57, 127, 104, "tile", [[170, 121, 20, 19]]);
    room(ctx, 46, 180, 127, 96, "tile", [[170, 213, 20, 20]]);
    room(ctx, 190, 57, 142, 219, "blue", [
      [172, 121, 21, 19],
      [172, 213, 21, 20],
      [329, 135, 20, 20],
    ]);
    room(ctx, 349, 57, 133, 219, "tile", [[331, 135, 21, 20]]);
    label(ctx, "Reception", 56, 70);
    label(ctx, "Pharmacy", 56, 194);
    label(ctx, "Waiting area", 200, 70);
    label(ctx, "Consultation", 359, 70);
    patch(ctx, 0, 12, 5, 1, 64, 91, 1.1);
    tile(ctx, "indoor", 23, 8, 58, 140, 25, 17);
    plant(ctx, 148, 135);
    plant(ctx, 195, 249);
    patch(ctx, 16, 16, 3, 2, 54, 204, 1.1);
    patch(ctx, 16, 16, 3, 2, 108, 204, 1.1);
    patch(ctx, 0, 12, 5, 1, 62, 249, 1.1);
    for (let j = 0; j < 3; j++) {
      tile(ctx, "indoor", 0, 8, 218, 96 + j * 49, 22, 22);
      tile(ctx, "indoor", 0, 8, 282, 96 + j * 49, 22, 22);
    }
    plant(ctx, 304, 249);
    patch(ctx, 0, 0, 3, 2, 380, 93, 1.1);
    tile(ctx, "indoor", 0, 2, 396, 115, 18, 18);
    patch(ctx, 14, 6, 2, 2, 430, 197, 1.2);
    patch(ctx, 16, 16, 3, 1, 418, 65, 1.1);
    plant(ctx, 358, 247);
    drawResidents(ctx, state);
    const p = {
      Reception: [143, 140],
      "Waiting Area": [257, 204],
      "Consultation Room": [390, 143],
      Pharmacy: [140, 248],
    };
    person(ctx, "Chris", ...(p[state.area] || p.Reception), true);
    label(ctx, "Main entrance", 222, 298, true);
  }
  function road(ctx, state) {
    for (let y = 53; y < 284; y += 16)
      for (let x = 35; x < 493; x += 16) tile(ctx, "city", 1, 26, x, y);
    for (let y = 142; y < 222; y += 16)
      for (let x = 35; x < 493; x += 16) tile(ctx, "city", 10, 20, x, y);
    ctx.fillStyle = "#e9dfad";
    for (let x = 36; x < 492; x += 37) ctx.fillRect(x, 181, 20, 2);
    for (let x = 35; x < 493; x += 16) {
      tile(ctx, "city", 4, 20, x, 126);
      tile(ctx, "city", 4, 20, x, 222);
    }
    for (let y = 144; y < 215; y += 12) {
      ctx.fillStyle = "#dddac8";
      ctx.fillRect(338, y, 34, 5);
    }
    for (let x = 65; x < 170; x += 16)
      for (let y = 70; y < 119; y += 16) tile(ctx, "city", 9, 6, x, y);
    for (let x = 65; x < 170; x += 16) tile(ctx, "city", 9, 4, x, 54);
    tile(ctx, "city", 17, 12, 107, 94, 23, 28);
    label(ctx, "Home entrance", 65, 44);
    for (let x = 387; x < 477; x += 16)
      for (let y = 70; y < 119; y += 16) tile(ctx, "city", 17, 6, x, y);
    for (let x = 387; x < 477; x += 16) tile(ctx, "city", 17, 4, x, 54);
    tile(ctx, "city", 22, 6, 427, 93, 23, 28);
    label(ctx, "Hospital", 391, 44);
    ctx.fillStyle = "#e8e6cc";
    ctx.fillRect(421, 64, 14, 4);
    ctx.fillRect(426, 59, 4, 14);
    for (const x of [40, 185, 325, 475]) {
      tile(ctx, "city", 33, 10, x, 85, 20, 27);
      tile(ctx, "city", 33, 11, x, 112, 20, 27);
    }
    patch(ctx, 4, 4, 3, 1, 228, 105, 1);
    tile(ctx, "city", 8, 14, 224, 80, 18, 32);
    label(ctx, "Bus stop", 231, 75);
    label(ctx, "Crossing", 337, 246, true);
    label(ctx, "Sidewalk", 70, 244, true);
    for (const x of [42, 140, 260, 460]) {
      tile(ctx, "city", 33, 10, x, 250, 20, 27);
      tile(ctx, "city", 33, 11, x, 277, 20, 27);
    }
    drawResidents(ctx, state);
    const p = {
      "Bus Stop": [263, 118],
      Sidewalk: [185, 116],
      Crossing: [347, 232],
      "Home Entrance": [114, 117],
      "Hospital Entrance": [426, 117],
    };
    person(ctx, "Chris", ...(p[state.area] || p["Bus Stop"]), true);
  }
  function drawResidents(ctx, state) {
    const positions = {
      Home: {
        Entrance: [442, 240],
        "Living Room": [277, 135],
        Kitchen: [443, 138],
        Bedroom: [144, 113],
        "Child's Room": [100, 240],
      },
      Hospital: {
        Reception: [103, 130],
        Pharmacy: [102, 238],
        "Waiting Area": [257, 242],
        "Consultation Room": [402, 94],
      },
      Road: {
        "Bus Stop": [282, 105],
        Sidewalk: [85, 112],
        Crossing: [347, 232],
        "Home Entrance": [114, 117],
        "Hospital Entrance": [426, 117],
      },
    };
    const occupied = {};
    for (const [id, p] of Object.entries(state.npcs || {})) {
      const routine = Schedules.slot(p, state);
      if (!routine || routine.scene !== state.scene) continue;
      const pos =
        positions[state.scene][routine.area] ||
        positions[state.scene][Object.keys(positions[state.scene])[0]];
      const count = occupied[routine.area] || 0;
      occupied[routine.area] = count + 1;
      person(
        ctx,
        id,
        pos[0] + (count % 3) * 25,
        pos[1] + Math.floor(count / 3) * 30,
      );
    }
  }
  function draw(canvas, state) {
    if (!loaded) return;
    activeState = state;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 528, 300);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--map")
        .trim() || "#e8ebdd";
    ctx.fillRect(0, 0, 528, 300);
    ctx.save();
    ctx.translate(0, -20);
    if (state.scene === "Home") home(ctx, state);
    else if (state.scene === "Hospital") hospital(ctx, state);
    else road(ctx, state);
    ctx.restore();
  }
  return { load, draw, avatar };
})();
