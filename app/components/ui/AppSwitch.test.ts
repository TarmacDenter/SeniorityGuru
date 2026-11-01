import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppSwitch from './AppSwitch.vue'

describe('AppSwitch', () => {
  it('reads On when the switch is on', async () => {
    const wrapper = await mountSuspended(AppSwitch, { props: { modelValue: true } })
    expect(wrapper.text()).toContain('On')
    expect(wrapper.text()).not.toContain('Off')
  })

  it('reads Off when the switch is off', async () => {
    const wrapper = await mountSuspended(AppSwitch, { props: { modelValue: false } })
    expect(wrapper.text()).toContain('Off')
  })

  it('flips to On and emits the new value when clicked', async () => {
    const wrapper = await mountSuspended(AppSwitch, {
      props: {
        modelValue: false,
        'onUpdate:modelValue': (value: boolean) => wrapper.setProps({ modelValue: value }),
      },
    })
    await wrapper.find('button[role="switch"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    expect(wrapper.text()).toContain('On')
  })

  it('keeps the label it is given beside the On/Off text', async () => {
    const wrapper = await mountSuspended(AppSwitch, {
      props: { modelValue: false, label: 'Enable New Hire Mode' },
    })
    expect(wrapper.text()).toContain('Enable New Hire Mode')
    expect(wrapper.text()).toContain('Off')
  })
})
