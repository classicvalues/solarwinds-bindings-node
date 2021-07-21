/* global describe, it */
'use strict'

const bindings = require('../')
const expect = require('chai').expect

const env = process.env

describe('addon.reporter', function () {
  let r
  if (typeof bindings.Reporter === 'function') {
    r = new bindings.Reporter()
  } else {
    r = bindings.Reporter
  }
  const serviceKey = `${env.AO_TOKEN_PROD}:node-bindings-test`

  it('should initialize oboe with only a service key', function () {
    const status = bindings.oboeInit({ serviceKey })
    // kind of funky but -1 is already initialized, 0 is ok. mocha runs
    // multiple tests in one process so the result is 0 if run standalone
    // but -1 on all but the first if run as a suite.
    expect(status).oneOf([-1, 0])
  })

  it('should initialize oboe with hostnameAlias', function () {
    const options = { serviceKey, hostnameAlias: 'node-testing-hostname' }
    const status = bindings.oboeInit(options)
    expect(status).equal(-1)
  })

  it('should send a generic span', function () {
    const customName = 'this-is-a-name'
    const domain = 'bruce.com'

    let finalTxName = r.sendNonHttpSpan({
      duration: 1001
    })
    expect(finalTxName).equal('unknown')

    finalTxName = r.sendNonHttpSpan({
      domain: domain
    })
    expect(finalTxName).equal(domain + '/')

    finalTxName = r.sendNonHttpSpan({
      txname: customName,
      duration: 1111
    })
    expect(finalTxName).equal(customName)

    finalTxName = r.sendNonHttpSpan({
      txname: customName,
      domain: domain,
      duration: 1234
    })
    expect(finalTxName).equal(domain + '/' + customName)
  })

  it('should send an HTTP span', function () {
    const customName = 'this-is-a-name'
    const domain = 'bruce.com'
    const url = '/api/todo'
    const status = 200
    const method = 'GET'

    let finalTxName = r.sendHttpSpan({
      url: url,
      status: status,
      method: method,
      duration: 1111
    })
    expect(finalTxName).equal(url)

    finalTxName = r.sendHttpSpan({
      url: url,
      domain: domain
    })
    expect(finalTxName).equal(domain + url)

    finalTxName = r.sendHttpSpan({
      txname: customName,
      url: url,
      duration: 1234
    })
    expect(finalTxName).equal(customName)

    finalTxName = r.sendHttpSpan({
      txname: customName,
      url: url,
      domain: domain,
      duration: 1236
    })
    expect(finalTxName).equal(domain + '/' + customName)
  })

  it('should not crash node getting the prototype of a reporter instance', function () {
    // eslint-disable-next-line no-unused-vars
    const p = Object.getPrototypeOf(r)
  })
})
