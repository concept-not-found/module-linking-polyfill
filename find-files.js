import { join } from 'path'
import { readdir, stat } from 'fs/promises'

export default async function* findFiles(
  filenameFilter = () => true,
  rootPath = '.'
) {
  for (const filename of await readdir(rootPath)) {
    const path = join(rootPath, filename)
    const fileStat = await stat(path)
    if (fileStat.isDirectory()) {
      yield* findFiles(filenameFilter, path)
    } else {
      if (!filenameFilter(filename)) {
        continue
      }
      yield path
    }
  }
}
