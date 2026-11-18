import {Wordgard, KeyBinding} from "wordgard/editor"
import {Command, deleteLine, killToLineEnd, yankKilled} from "wordgard/command"
import {GardState} from "wordgard/state"
import {Plot} from "wordgard/doc"
import ist from "ist"
import {tempEditor} from "./tempview.ts"
import {basicBuilders, maybeTag, eq} from "./schema.ts"
const {doc, p, br, strong} = basicBuilders

function test1<T>(doc: Plot.Doc, cmd: Command<T>, arg: T, expect: Plot.Doc | null, config: GardState.Extension = []) {
  let wg = tempEditor(doc, config)
  let result = Command.dispatch(wg, cmd, arg)
  ist(result, expect != null)
  if (expect) {
    ist(wg.state.doc, expect, eq)
    if (maybeTag(expect, 0) != null)
      ist(wg.state.selection.head, maybeTag(expect, 0))
  }
}

function test(doc: Plot.Doc, cmd: Command<null>, expect: Plot.Doc | null, config: GardState.Extension = []) {
  test1(doc, cmd, null, expect, config)
}

const narrow = Wordgard.theme({"&": {width: "20ex"}})

describe("deleteLine", () => {
  it("clears an entire paragraph", () => {
    test(doc(p("foo", 0), p("bar")), deleteLine, doc(p(0), p("bar")))
  })

  it("doesn't clear past wrap points", () => {
    test(doc(p("bigwordone bigword", 0, "two bigwordthree")), deleteLine, doc(p("bigwordone ", 0, "bigwordthree")), narrow)
  })
})

describe("killToLineEnd", () => {
  it("deletes content after the cursor", () => {
    test(doc(p("one ", 0, "two")), killToLineEnd, doc(p("one ", 0)))
  })

  it("joins textblocks when at the end of one", () => {
    test(doc(p("one", 0), p("two")), killToLineEnd, doc(p("one", 0, "two")))
  })

  it("deletes line breaks", () => {
    test(doc(p("one", 0, br, "two")), killToLineEnd, doc(p("one", 0, "two")))
  })

  it("does nothing at end of doc", () => {
    test(doc(p("one", 0)), killToLineEnd, null)
  })

  it("stores content in the kill buffer", () => {
    let wg = tempEditor(doc(p("a", 0, "b")))
    Command.dispatch(wg, killToLineEnd)
    Command.dispatch(wg, yankKilled)
    Command.dispatch(wg, yankKilled)
    ist(wg.state.doc, doc(p("abb")), eq)
    ist(wg.state.selection.head, 4)
  })

  it("accumulates killed content", () => {
    let wg = tempEditor(doc(p("a", 0, "b", strong("c")), p("d")))
    Command.dispatch(wg, killToLineEnd)
    Command.dispatch(wg, killToLineEnd)
    Command.dispatch(wg, killToLineEnd)
    ist(wg.state.doc, doc(p("a")), eq)
    Command.dispatch(wg, yankKilled)
    ist(wg.state.doc, doc(p("a", 0, "b", strong("c")), p("d")), eq)
  })

  it("stops accumulating on cursor motion", () => {
    let wg = tempEditor(doc(p("a", 0, "b"), p("cd")))
    Command.dispatch(wg, killToLineEnd)
    wg.dispatch({selection: {anchor: 5}})
    Command.dispatch(wg, killToLineEnd)
    ist(wg.state.doc, doc(p("a"), p("c")), eq)
    Command.dispatch(wg, yankKilled)
    ist(wg.state.doc, doc(p("a"), p("cd")), eq)
  })

  it("stops accumulating on document changes", () => {
    let wg = tempEditor(doc(p("a", 0, "b"), p("cd")))
    Command.dispatch(wg, killToLineEnd)
    wg.dispatch({changes: {from: 5, to: 6}})
    Command.dispatch(wg, killToLineEnd)
    Command.dispatch(wg, yankKilled)
    ist(wg.state.doc, doc(p("a"), p("c")), eq)
  })
})

function normalizeForPlatform(name: string, platform: "mac" | "linux") {
  let parts = name.split(/-(?!$)/), key = parts[parts.length - 1]
  let alt = false, ctrl = false, shift = false, meta = false
  for (let i = 0; i < parts.length - 1; i++) {
    let mod = parts[i]
    if (mod == "Cmd" || mod == "Meta") meta = true
    else if (mod == "Alt") alt = true
    else if (mod == "Ctrl") ctrl = true
    else if (mod == "Shift") shift = true
    else if (mod == "Mod") { if (platform == "mac") meta = true; else ctrl = true }
  }
  if (alt) key = "Alt-" + key
  if (ctrl) key = "Ctrl-" + key
  if (meta) key = (platform == "mac" ? "Cmd-" : "Meta-") + key
  if (shift) key = "Shift-" + key
  return key
}

function runDefaultKey(wg: Wordgard, platform: "mac" | "linux", keyName: string) {
  let target = normalizeForPlatform(keyName, platform)
  for (let b of KeyBinding.defaultKeymap) {
    let raw = b.spec[platform] || b.spec.key
    if (!raw) continue
    if (normalizeForPlatform(raw, platform) == target && Command.dispatch(wg, b.spec.run))
      return true
    if (b.spec.shift && normalizeForPlatform("Shift-" + raw, platform) == target && Command.dispatch(wg, b.spec.shift))
      return true
  }
  return false
}

describe("defaultKeymap horizontal motion", () => {
  it("moves to line boundaries on macOS Cmd-Arrow and by word on Alt-Arrow", () => {
    let wg = tempEditor(doc(p("one two three", 0)))
    ist(runDefaultKey(wg, "mac", "Cmd-ArrowLeft"), true)
    ist(wg.state.selection.head, 1)
    ist(runDefaultKey(wg, "mac", "Cmd-ArrowRight"), true)
    ist(wg.state.selection.head, 14)
    ist(runDefaultKey(wg, "mac", "Alt-ArrowLeft"), true)
    ist(wg.state.selection.head, 9)
    ist(runDefaultKey(wg, "mac", "Shift-Cmd-ArrowLeft"), true)
    ist(wg.state.selection.anchor, 9)
    ist(wg.state.selection.head, 1)
  })

  it("moves by word on non-macOS Ctrl-Arrow", () => {
    let wg = tempEditor(doc(p("one two three", 0)))
    ist(runDefaultKey(wg, "linux", "Ctrl-ArrowLeft"), true)
    ist(wg.state.selection.head, 9)
    ist(runDefaultKey(wg, "linux", "Ctrl-ArrowRight"), true)
    ist(wg.state.selection.head, 14)
  })
})
