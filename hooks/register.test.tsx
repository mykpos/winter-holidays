import { expect, test } from 'claude-code/testing'

import { winterScene } from './scene.js'
const BACKDROP = {
  component: 'Backdrop',
  requestId: 'winter',
  props: { scene: 'winter-night', plugin: 'winter-holidays', glass: false },
} as const

test('the winter scene draws its Svg on desktop', async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, plugin: 'winter-holidays', surface: 'desktop' })

  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  expect(await ui.find({ type: 'Shader' })).toBeUndefined()
  await ui.unmount()
})

test('another plugin scene goes on to the engine', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({
    ...BACKDROP,
    plugin: 'winter-holidays',
    surface: 'desktop',
    props: { ...BACKDROP.props, plugin: 'other-mod' },
  })

  expect(await ui.find({ type: 'Text', text: /engine/ })).toBeDefined()
  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})

test('the terminal surface goes on to the engine', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({ ...BACKDROP, plugin: 'winter-holidays', surface: 'terminal' })

  expect(await ui.find({ type: 'Svg' })).toBeUndefined()
  await ui.unmount()
})

test('the winter scene draws its Svg on mobile', async $ => {
  const ui = await $.ui.mount({ ...BACKDROP, plugin: 'winter-holidays', surface: 'mobile' })

  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})

test('the scene markup stays under the Svg size limit and has no broken numbers', () => {
  const svg = winterScene()

  expect(svg.length).toBeLessThan(131072)
  expect(svg).not.toMatch(/NaN|undefined|<image|href|CDATA|<!--|&/)
})
