import { makeDedent } from './dedent.js'

const onedent = makeDedent('  ')

export default (string) => onedent(string).trim()
