export default function parse(tokens) {
  const parser = new Parser(tokens)
  return JSON.parse(JSON.stringify(parser.parse()))
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.clauses = []
  }

  consume(len) {
    this.tokens = this.tokens.slice(len)
  }

  parse() {
    while (this.tokens.length > 0) {
      try {
        this.parseClause()
      } catch (err) {
        console.error('Compiler failed to parse clause, because:')
        console.error(err.message)
        process.exit(1)
      }
    }
    return this.clauses
  }

  parseClause() {
    const headLiteral = this.parseLiteral()
    if (this.maybeParseLiteralAsFact(headLiteral)) {
      return
    }
    if (this.maybeParseLiteralAsRule(headLiteral)) {
      return
    }
    throw new Error('Invalid clause was neither a fact nor a rule.')
  }

  parseLiteral() {
    const predicateName = this.parsePredicateName()
    let predicateArguments = []
    const nextTokenType = this.tokens[0].type
    if (nextTokenType !== '.' && nextTokenType !== 'if' && nextTokenType !== 'and') {
      predicateArguments = this.parseArguments()
    }
    return {
      type: 'literal',
      name: predicateName,
      arity: predicateArguments.length,
      arguments: predicateArguments,
    }
  }

  maybeParseLiteralAsFact(headLiteral) {
    const nextTokenType = this.tokens[0].type
    if (nextTokenType === '.') {
      this.assertLiteralIsFact(headLiteral)
      this.consume(1) // the period
      this.clauses.push({
        type: 'fact',
        literal: headLiteral,
      })
      return true
    }
    return false
  }

  maybeParseLiteralAsRule(headLiteral) {
    const nextTokenType = this.tokens[0].type
    if (nextTokenType !== 'if') {
      throw new Error(`Rule head should be followed by an 'if' but was ${nextTokenType}`)
    }
    this.consume(1) // the if
    const body = []
    const tokensLen = this.tokens.length
    let i = 0
    for (; this.tokens.length > 0 && this.tokens[0].type !== '.'; i++) {
      if (i % 2 === 0) {
        body.push(this.parseLiteral())
      } else if (this.tokens[0].type === 'and') {
        this.consume(1) // and
      } else {
        throw new Error(`Rule body literals must be separated with 'and' but ` +
          `found ${this.tokens[0].type}`)
      }
    }
    if (this.tokens[0].type !== '.') {
      throw new Error(`Rule body should have been terminated with a period ` +
        `'.', but found ${this.tokens[0].type}`)
    }
    this.consume(1) // the period
    const rule = {
      type: 'rule',
      head: headLiteral,
      body: body,
    }
    this.assertRuleIsSafe(rule)
    this.clauses.push(rule)
    return true
  }

  parsePredicateName() {
    const name = this.tokens[0]
    if (name.type !== 'identifier') {
      throw new Error(`Expected a predicate name but found ${name.value}`)
    }
    if (/^[a-z]/.exec(name.value) === null) {
      throw new Error(`Predicate name must start with a lowercase character ` +
        `but was ${name.value}`)
    }
    this.consume(1)
    return name.value
  }

  parseArguments() {
    if (this.tokens[0].type !== '(') {
      throw new Error(`Predicate arguments expected to have opening parens ` +
        `'(' but found a ${this.tokens[0].type}`)
    }
    const tokensLen = this.tokens.length
    const args = []
    let i = 1
    for (; i < tokensLen && this.tokens[i].type !== ')'; i++) {
      const token = this.tokens[i]
      const tokenType = token.type
      const tokenValue = token.value
      if (tokenType === 'identifier') {
        const isLowercase = /^[a-z]\w*/.exec(tokenValue) !== null
        args.push({
          type: isLowercase ? 'atom' : 'variable',
          value: tokenValue
        })
      } else if (tokenType === 'number') {
        args.push({
          type: 'number',
          value: tokenValue
        })
      } else if (tokenType !== ',' && tokenType !== ')') {
        throw new Error('Invalid arguments for a predicate.')
      }
    }
    if (this.tokens[i].type !== ')') {
      throw new Error(`Predicate arguments should have been terminated with ` +
        `closing parens ')', but found ${this.tokens[i].type}`)
    }
    this.consume(i+1)
    return args
  }

  assertLiteralIsFact(literal) {
    const args = literal.arguments
    const argsLen = args.length
    for (var i = argsLen - 1; i >= 0; i--) {
      if (args[i].type !== 'number' && args[i].type !== 'atom') {
        throw new Error('Fact arguments cannot be variables.')
      }
    }
    return true
  }

  assertRuleIsSafe(rule) {
    const isArgVariable = arg => arg.type === 'variable'
    const toValue = arg => arg.value
    const toSet = (acc, v) => acc.indexOf(v) === -1 ? acc.concat(v) : acc
    const headVars = rule.head.arguments
      .filter(isArgVariable)
      .map(toValue)
      .reduce(toSet, [])
    const bodyVars = rule.body.reduce((acc, literal) =>
      acc.concat(literal.arguments.filter(isArgVariable))
    , []).map(toValue).reduce(toSet, [])
    for (var i = headVars.length - 1; i >= 0; i--) {
      if (bodyVars.indexOf(headVars[i]) === -1) {
        throw new Error(`Rule head variable ${headVars[i]} was not found in rule body.`)
      }
    }
    return true
  }
}
