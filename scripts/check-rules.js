// Run in DevTools on ?page=cach-choi after the curtain opens.
// Repeat at 320/390/920/1280/1840px and with reduced motion enabled.
;(async () => {
  let passed = 0
  const check = (ok, label) => {
    if (!ok) throw Error(label)
    passed++
  }
  const frame = () => new Promise(requestAnimationFrame)
  // Allow the browser's delayed resize refresh to settle before seeking scenes.
  for (let i = 0; i < 30; i++) await frame()
  const root = document.querySelector(".rules-page")
  check(
    root && !root.querySelector(".rules-shell[inert]"),
    "Rules page is unlocked",
  )
  check(document.title === "Cách chơi — Thủy Trận", "Page title")
  check(document.fonts.check('700 16px "NVN Yellost"'), "Display font prepared")
  check(
    [...root.querySelectorAll("img")].every(
      (img) => img.complete && img.naturalWidth > 0,
    ),
    "Artwork prepared",
  )
  const story = root.querySelector(".match-story")
  const sharedNav = root.querySelector('.chapter-nav[data-page="cach-choi"]')
  check(
    sharedNav && root.querySelectorAll(".page-progress").length === 1,
    "Rules uses the shared navigation and one progress bar",
  )
  check(
    root.querySelector('.site-brand[href="./#top"]') &&
      root.querySelector('.site-cta[href="./#nhan-lenh"]'),
    "Original brand and Nhan lenh links return to landing",
  )
  sharedNav.querySelector(".nav-toggle").click()
  await frame()
  check(sharedNav.dataset.open === "true", "Shared menu opens")
  check(
    [...sharedNav.querySelectorAll(".nav-chapters a")].map(a => a.getAttribute("href")).join() ===
      "./#top,./#loi-lenh,./#roles,./#ke-sach,./#dia-diem,#cach-choi",
    "Original landing menu is reused on Rules",
  )
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  )
  await frame()
  check(
    sharedNav.dataset.open === "false",
    "Escape closes the menu without requiring focus inside",
  )
  const boardCheck = (board) => {
    const tiles = [...board.querySelectorAll(".match-tile")]
    check(
      tiles.length === 24 &&
        new Set(tiles.map((tile) => tile.dataset.id)).size === 24,
      "24 distinct locations",
    )
    check(
      [1, 2, 3, 4, 5, 6]
        .map(
          (row) =>
            tiles.filter((tile) => Number(tile.style.gridRow) === row).length,
        )
        .join() === "2,4,6,6,4,2",
      "Board arrangement",
    )
    check(
      [...board.querySelectorAll(".match-tile-paper img")].every(
        (img) => img.naturalWidth === img.naturalHeight,
      ),
      "Fronts and backs are square",
    )
  }
  if (story) {
    check(
      story.parentElement.classList.contains("pin-spacer"),
      "One native scroll pin",
    )
    check(
      root.querySelectorAll(".pin-spacer").length === 1,
      "No duplicate pin after StrictMode setup",
    )
    boardCheck(story.querySelector(".match-board"))
    const seek = async (phase) => {
      const pin = story.parentElement
      window.scrollTo({
        top:
          pin.getBoundingClientRect().top +
          scrollY +
          ((pin.offsetHeight - story.offsetHeight) * (phase + 0.8)) / 10,
        behavior: "instant",
      })
      for (let i = 0; i < 180; i++) {
        await frame()
        if (Number(story.dataset.phase) === phase) break
      }
      check(
        Number(story.dataset.phase) === phase,
        `Scroll restores scene ${phase}`,
      )
      for (let i = 0; i < 24; i++) await frame()
      const board = story.querySelector(".match-table").getBoundingClientRect()
      const controls = story
        .querySelector(".match-bottomline")
        .getBoundingClientRect()
      check(
        board.left >= 0 &&
          board.right <= innerWidth + 1 &&
          board.bottom <= controls.top + 1,
        "Board fits above controls",
      )
      check(controls.bottom <= innerHeight + 1, "Scene controls fit viewport")
      const text = story.querySelector(".match-copy").getBoundingClientRect()
      const side = story.querySelector(".match-sidebar").getBoundingClientRect()
      if (innerWidth <= 900) {
        check(text.bottom <= board.top, "Mobile text does not overlap board")
        check(
          board.bottom <= side.top + 1 && side.bottom <= controls.top + 1,
          "Mobile card rail stays outside board and controls",
        )
        check(
          text.top >=
            story.querySelector(".match-topline").getBoundingClientRect()
              .bottom,
          "Mobile title does not overlap scene label",
        )
      } else
        check(
          text.right <= board.left && board.right <= side.left,
          "Text, board and card rail occupy separate columns",
        )
      check(
        side.left >= 0 && side.right <= innerWidth + 1,
        "Card rail fits viewport",
      )
    }
    await seek(0)
    check(
      story.querySelectorAll('.match-tile[data-danger="true"]').length === 4,
      "Four initial dangerous tiles",
    )
    for (let phase = 1; phase <= 9; phase++) {
      await seek(phase)
      if (phase <= 5)
        check(
          story.querySelectorAll('.match-action-budget [data-used="true"]')
            .length === Math.min(phase, 3),
          "Only actions spend the action budget",
        )
      if (phase === 2)
        check(
          story.querySelector('[data-id="bai-tiep-luong"]').dataset.danger ===
            "false",
          "Reinforcement restores stable",
        )
      if (phase === 3)
        check(
          story.querySelectorAll(".match-hand-fan img").length === 4,
          "Transfer provides fourth matching card",
        )
      if (phase >= 1 && phase <= 3) {
        const roster = story.querySelector('.match-roster').getBoundingClientRect()
        check([...story.querySelectorAll('.match-hand-fan img')].every(img => img.getBoundingClientRect().bottom < roster.top || img.getBoundingClientRect().right < roster.left), "Card fan does not cover the character roster")
      }
      if (phase === 4)
        check(
          story.querySelectorAll(".match-hand-pair img").length === 2,
          "Two regular cards drawn",
        )
      if (phase === 5)
        check(
          story.querySelector('[data-id="bai-tiep-luong"]').dataset.danger ===
            "true",
          "Flood turns reinforced tile dangerous again",
        )
      if (phase === 6)
        check(
          story.querySelectorAll('.match-strategies [data-complete="true"]')
            .length === 1,
          "First strategy completed",
        )
      if (phase === 7)
        check(
          story.querySelector('[data-id="song-chanh"]').dataset.removed ===
            "true",
          "Second flood removes tile",
        )
      if (phase === 8)
        check(
          story.querySelector('[data-id="bai-tiep-luong"]').dataset.danger ===
            "false",
          "Synergy rescues before reveal",
        )
      if (phase === 9) {
        check(
          story.querySelectorAll('.match-strategies [data-complete="true"]')
            .length === 4,
          "All four strategies completed",
        )
        check(
          [...story.querySelectorAll(".match-pawn")].every((pawn) =>
            pawn.getAttribute("aria-label").includes("Lương Xâm"),
          ),
          "Entire party reaches headquarters",
        )
        const hq = story
          .querySelector('[data-id="luong-xam"]')
          .getBoundingClientRect()
        check(
          story.dataset.won === "true" &&
            [...story.querySelectorAll(".match-pawn")].every((pawn) => {
              const p = pawn.getBoundingClientRect()
              return (
                p.left + p.width / 2 >= hq.left &&
                p.right - p.width / 2 <= hq.right &&
                p.top + p.height / 2 >= hq.top &&
                p.bottom - p.height / 2 <= hq.bottom
              )
            }),
          "Victory waits for every pawn to actually reach headquarters",
        )
      }
    }
    await seek(2)
    check(
      !story.querySelector('.match-tile[data-removed="true"]'),
      "Reverse scroll restores removed tile",
    )
    await seek(0)
    check(
      story.querySelectorAll('.match-tile[data-danger="true"]').length === 4,
      "Reverse restores initial board",
    )
    check(
      story.querySelectorAll(".match-party button").length === 4,
      "Four inspectable character cards",
    )
    check(
      story.querySelector(".match-table").clientWidth >=
        Math.min(innerWidth - 40, innerWidth * 0.44, 500),
      "Board receives the main visual space",
    )
    check(
      story.querySelector(".match-brief").textContent.split(/\s+/).length <= 22,
      "Scene uses a short prompt",
    )
    const tile = story.querySelector('[data-id="bach-dang"] button')
    tile.focus()
    tile.click()
    await frame()
    const dialog = story.querySelector("dialog")
    check(dialog.open, "Location opens in a modal")
    check(dialog.contains(document.activeElement), "Focus enters the modal")
    check(
      dialog.querySelector(".match-inspect-paper").dataset.back === "true",
      "Inspection starts on the current dangerous face",
    )
    dialog.querySelector(".match-inspect-face button").click()
    await frame()
    check(
      dialog.querySelector(".match-inspect-paper").dataset.back === "false",
      "Both faces can be inspected",
    )
    check(
      story.querySelector('[data-id="bach-dang"]').dataset.danger === "true",
      "Inspection does not change the board",
    )
    dialog.querySelector(".match-inspect-close").click()
    await frame()
    check(
      !dialog.open && document.activeElement === tile,
      "Closing restores focus to the card",
    )
    const person = story.querySelector(".match-party button")
    person.click()
    await frame()
    check(
      dialog.open && dialog.querySelector(".match-inspect-person"),
      "Character artwork and ability can be read",
    )
    dialog.querySelector(".match-inspect-close").click()
    await frame()
    story.querySelector('[data-actionable="true"] button').click()
    for (let i = 0; i < 180 && Number(story.dataset.phase) !== 1; i++)
      await frame()
    check(
      Number(story.dataset.phase) === 1,
      "Board target advances the same scroll sequence",
    )
    await seek(1)
    story.querySelector(".match-play").click()
    for (let i = 0; i < 180 && Number(story.dataset.phase) !== 2; i++)
      await frame()
    check(
      Number(story.dataset.phase) === 2,
      "Context action advances to reinforcement",
    )
    await seek(3)
    story.querySelector(".match-sidebar .match-hand-fan").click()
    await frame()
    check(
      dialog.open && dialog.querySelector("h3").textContent === "Cọc Ngầm",
      "Relevant strategy card can be read from the right rail",
    )
    dialog.querySelector(".match-inspect-close").click()
    await frame()
    await seek(9)
    story.querySelector(".match-play").click()
    for (let i = 0; i < 180 && Number(story.dataset.phase) !== 0; i++)
      await frame()
    check(
      Number(story.dataset.phase) === 0,
      "Replay returns to the initial state",
    )
    await seek(0)
  } else {
    check(
      root.querySelectorAll(".match-static-scene").length === 10,
      "All ten scenes readable without motion",
    )
    check(!root.querySelector(".pin-spacer"), "Static reading has no pin")
    root
      .querySelectorAll(".match-static-scene .match-board")
      .forEach(boardCheck)
  }
  const details = [...root.querySelectorAll(".rules-reference details")]
  check(details.length === 6, "Six quick-reference topics")
  for (const item of details) {
    item.querySelector("summary").click()
    check(item.open, "Reference opens")
    item.querySelector("summary").click()
  }
  check(
    root.querySelectorAll(".rules-characters article").length === 6,
    "All six printed roles",
  )
  check(
    root.querySelector('.site-footer a[href="./#roles"]'),
    "Footer returns to landing chapters",
  )
  check(
    root.querySelector('.site-footer a[href="#cach-choi"]'),
    "Footer top stays on rules",
  )
  if (innerWidth <= 760) {
    const menu = root.querySelector(".rules-toc > button")
    menu.click()
    await frame()
    check(
      menu.getAttribute("aria-expanded") === "true",
      "Mobile contents expands",
    )
    root.querySelector('.rules-toc a[href="#mot-luot"]').click()
    await frame()
    check(
      menu.getAttribute("aria-expanded") === "false",
      "Contents closes on selection",
    )
    check(
      document.activeElement.id === "mot-luot-title",
      "Chapter heading receives focus",
    )
  }
  check(
    document.documentElement.scrollWidth <= innerWidth,
    "No horizontal overflow",
  )
  check(
    [...root.querySelectorAll("button, h1, h2")]
      .filter((el) => el.getClientRects().length)
      .every((el) => {
        const box = el.getBoundingClientRect()
        return box.left >= -1 && box.right <= innerWidth + 1
      }),
    "Headings and controls fit",
  )
  const result = {
    passed,
    width: innerWidth,
    mode: story ? "scroll" : "static",
  }
  console.log("Rules checks passed", result)
  return result
})()
