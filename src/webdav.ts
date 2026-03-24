const WD_PREFIX = '/wd/'

export async function webdavGet(filename: string): Promise<string | null> {
  try {
    const res = await fetch(WD_PREFIX + encodeURIComponent(filename))
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function webdavPut(filename: string, content: string): Promise<void> {
  await fetch(WD_PREFIX + encodeURIComponent(filename), {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: content
  })
}

export async function webdavPropfind(filename: string): Promise<number> {
  try {
    const res = await fetch(WD_PREFIX + encodeURIComponent(filename), {
      method: 'PROPFIND'
    })
    return res.status
  } catch {
    return 0
  }
}

export async function webdavCreate(filename: string): Promise<void> {
  await fetch(WD_PREFIX + encodeURIComponent(filename), {
    method: 'PUT'
  })
}
