export default function lex(str) {
  const lexer = new Lexer(str)
  return JSON.parse(JSON.stringify(lexer.tokenize()))
}

class Lexer {
  constructor(str) {
    this.input = str.replace(/\r\n+|\t+|\r+|\n+/g, ' ').replace(/ +/g, ' ')
    this.ended = false
    this.tokens = []
    console.log(`Lexer input is:\n${this.input}\n\n`)
  }

  consume(len) {
    this.input = this.input.substr(len)
  }

  tokenize() {
    while (!this.ended) {
      this.advance()
    }
    return this.tokens
  }

  advance() {
    return this.lexBlank() ||
      this.lexIf() ||
      this.lexAnd() ||
      this.lexNot() ||
      this.lexOpenParen() ||
      this.lexCloseParen() ||
      this.lexComma() ||
      this.lexPeriod() ||
      this.lexMathComparison() ||
      this.lexNumber() ||
      this.lexIdentifier() ||
      this.lexEnd() ||
      this.fail()
  }

  fail() {
    console.error('Compiler failed to understand input string:')
    console.error(this.input.substr(0, 10) + '(...)')
    console.error('\n')
    process.exit(1)
  }

  lexBlank() {
    let captured
    if (captured = /^ +/.exec(this.input)) {
      this.consume(captured[0].length)
      return true
    }
  }

  lexIf() {
    let captured
    if (captured = /^if\b/.exec(this.input)) {
      this.consume(2)
      this.tokens.push({type: 'if'})
      return true
    }
  }

  lexAnd() {
    let captured
    if (captured = /^and\b/.exec(this.input)) {
      this.consume(3)
      this.tokens.push({type: 'and'})
      return true
    }
  }

  lexNot() {
    let captured
    if (captured = /^not\b/.exec(this.input)) {
      this.consume(3)
      this.tokens.push({type: 'not'})
      return true
    }
  }

  lexOpenParen() {
    let captured
    if (captured = /^\((?!\()/.exec(this.input)) {
      this.consume(1)
      this.tokens.push({type: '('})
      return true
    }
  }

  lexCloseParen() {
    let captured
    if (captured = /^\)(?!\))/.exec(this.input)) {
      this.consume(1)
      this.tokens.push({type: ')'})
      return true
    }
  }

  lexComma() {
    let captured
    if (captured = /^\,(?!\,)/.exec(this.input)) {
      this.consume(1)
      this.tokens.push({type: ','})
      return true
    }
  }

  lexPeriod() {
    let captured
    if (captured = /^\.(?!\.)/.exec(this.input)) {
      this.consume(1)
      this.tokens.push({type: '.'})
      return true
    }
  }

  lexMathComparison() {
    let captured
    if (captured = /^(\=|\<|\>|\/\=)/.exec(this.input)) {
      this.consume(captured[0].length)
      this.tokens.push({type: 'mathComparison', value: captured[1]})
      return true
    }
  }

  lexNumber() {
    let captured
    if (captured = /^((\-|\+)?\d+(\.\d+)?)/.exec(this.input)) {
      this.consume(captured[0].length)
      this.tokens.push({type: 'number', value: captured[1]})
      return true
    }
  }

  lexIdentifier() {
    let captured
    if (captured = /^([A-Za-z][A-Za-z0-9_\!-]*)/.exec(this.input)) {
      this.consume(captured[0].length)
      this.tokens.push({type: 'identifier', value: captured[1]})
      return true
    }
  }

  lexEnd() {
    if (this.input.length === 0) {
      this.ended = true
      return true
    }
  }
}
