type AirlineOption = { label: string; value: string }

export function useAirlineOptions() {
  const db = useDb()
  const options = ref<AirlineOption[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    const { data } = await db.from('airlines').select('icao, name, alias').order('name')
    options.value = (data ?? []).map(a => ({
      label: a.alias ? `${a.alias} / ${a.name} (${a.icao})` : `${a.name} (${a.icao})`,
      value: a.icao,
    }))
    loading.value = false
  }

  return { options, loading, load }
}
