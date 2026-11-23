import type { EngineInterface, Register, ThemeMessageRule, ThemeResult, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { winterScene } from './scene.js'

const PLUGIN_NAME = 'winter-holidays'
const SCENE_NAME = 'winter-night'
const SCENE = winterScene()
const SCENE_ALT =
  'A snowy winter valley with a cabin, a decorated Christmas tree and a garland of lights; Santa flies by on his sleigh, and on dark nights shooting stars cross the northern lights'

// Frosty paper by day, a moonlit snowy night by dark.
const { theme, problems } = makeColors({
  label: 'Winter holidays',
  roles: { accent: '#b3203a', danger: '#d03b2f', success: '#2e7d4f', warning: '#c08a1e', pro: '#5b6fb8' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e9f0f7',
        'surface-1': '#f2f6fa',
        'surface-2': '#f9fbfd',
        'text-primary': '#14233a',
        'text-secondary': '#34465d',
        'text-muted': '#4f6177',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0d1726',
        'surface-1': '#132034',
        'surface-2': '#18283f',
        'surface-3': '#1c2d46',
        'text-primary': '#eaf1f8',
        'text-secondary': '#c3d0de',
        'text-muted': '#9eafc3',
      },
    },
  },
})

const bubble: ThemeMessageRule = {
  color: '#ffffff',
  radius: 18,
  paddingX: 16,
  paddingY: 12,
  shadow: { y: 3, blur: 10, color: '#0b162633' },
}

const STYLE: ThemeStyle = {
  Heading: { fontFamily: ['serif'], fontWeight: 'semibold' },
  UserMessage: [
    { ...bubble, backgroundColor: '#a51c30', borderColor: '#f2c14e', borderWidth: 1 },
    { ...bubble, backgroundColor: '#1f5c46', borderColor: '#f2c14e', borderWidth: 1 },
  ],
  AssistantMessage: {
    color: 'text-primary',
    backgroundColor: 'surface-1',
    borderColor: 'border',
    borderWidth: 1,
    radius: 18,
    padding: 16,
    shadow: { y: 2, blur: 12, color: '#0b16261f' },
  },
  ToolUse: { color: 'text-secondary', backgroundColor: 'surface-2', radius: 10, paddingX: 10 },
}

const BELLS = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7'] as const

const SOUND: ThemeSound = {
  ambience: {
    reverb: 0.5,
    layers: [
      { wave: 'pink', drone: true, gain: 0.12, filter: { type: 'lowpass', hz: 500, to: 1100 }, tremolo: { hz: 0.08, depth: 0.5 } },
      { wave: 'bell', notes: BELLS, scatter: 0.07, gain: 0.08, attack: 0.005, release: 2.5 },
    ],
  },
  cues: {
    send: { layers: [{ wave: 'bell', notes: ['G6'], gain: 0.25, release: 0.8 }] },
    tool: { layers: [{ wave: 'triangle', notes: ['E7'], gain: 0.08, release: 0.12 }] },
    done: { reverb: 0.4, layers: [{ wave: 'bell', notes: ['E6', 'G6', 'C7'], step: 0.12, gain: 0.3, release: 1.4 }] },
    ask: { layers: [{ wave: 'bell', notes: ['A6', 'E6'], step: 0.15, gain: 0.25, release: 1 }] },
    error: { layers: [{ wave: 'triangle', notes: ['E4', 'C4'], step: 0.18, gain: 0.2, release: 0.5 }] },
    compact: { layers: [{ wave: 'crackle', gain: 0.2, release: 0.6 }] },
    click: { layers: [{ wave: 'bell', notes: BELLS, gain: 0.25, release: 1.2 }] },
  },
}

const BASE: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE_NAME, glass: { blur: 16, opacity: 0.62 } },
}

const FULL: ThemeSetArgs = { ...BASE, style: STYLE, sound: SOUND }

// The whole look first; a build that refuses style or sound gets colors and scene alone.
async function setLook($: EngineInterface): Promise<ThemeResult> {
  try {
    return await $.theme.set(FULL)
  } catch (error) {
    $.ui.log(`winter-holidays: full look refused (${String(error)}); retrying with colors and scene only`)
    return $.theme.set(BASE)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }

    try {
      const result = await setLook($)
      if (!result.isDrawn) {
        $.ui.status(result.reason)
      }
    } catch (error) {
      $.ui.toast(`Winter theme could not be applied: ${String(error)}. Restart the session to try again.`)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.scene !== SCENE_NAME || e.props.plugin !== PLUGIN_NAME) {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg source={SCENE} alt={SCENE_ALT} isInteractive />
  })
}
