import fs from 'fs'
import lex from './lexer'
import parse from './parser'

const inputFilename = process.argv[1]
const inputString = fs.readFileSync(inputFilename, 'ascii')

console.log(`Suladed compiler operating on ${inputFilename} ...\n\n`)

const tokens = lex(inputString)
console.log('Tokens:')
console.log(tokens)
console.log()
console.log()

const clauses = parse(tokens)
console.log('Program clauses:')
console.log(JSON.stringify(clauses, null, '  '))
console.log()
console.log()
