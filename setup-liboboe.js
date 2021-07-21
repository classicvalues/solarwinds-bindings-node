'use strict'

const fs = require('fs')
const releaseInfo = require('linux-os-info')

const dir = './oboe/'
const soname = 'liboboe-1.0.so.0'

// don't delete unused yet. old versions of npm (3.10.10) don't
// have prepare and prepublishOnly which are needed to sequence
// downloading/installing liboboe and the running setup-liboboe
// to get the links right.
const deleteUnused = false

//
// these versions of the .so library are included in the package.
//
const oboeNames = {
  linux: 'liboboe-1.0-x86_64.so.0.0.0',
  alpine: 'liboboe-1.0-alpine-x86_64.so.0.0.0',
  alpineLibreSSL: 'liboboe-1.0-alpine-libressl-x86_64.so.0.0.0'
}

function setupLiboboe (cb) {
  // const version = fs.readFileSync(dir + 'VERSION', 'utf8').slice(0, -1)

  releaseInfo().then(info => {
    if (info.platform !== 'linux') {
      const line1 = `AppopticsApm warning: the ${info.platform} platform is not yet supported`
      const line2 = 'see: https://docs.appoptics.com/kb/apm_tracing/supported_platforms/'
      const line3 = 'Contact support@appoptics.com if this is unexpected.'
      const bar = '='.repeat([line1, line2, line3].reduce((m, l) => l.length > m ? l.length : m, 0))
      /* eslint-disable no-console */
      console.log(bar)
      console.log(line1)
      console.log(line2)
      console.log(line3)
      console.log(bar)
      process.exit(1)
      /* eslint-enable no-console */
    }
    let versionKey = 'linux'
    if (info.id === 'alpine') {
      versionKey = 'alpine'
      // if greater than version 3.9 then use alpine with openSSL. if less than 3.9
      // use the libreSSL version.
      // const parts = info.version_id.split('.').map(p => parseInt(p));
      // if (parts[0] > 3) {
      //  versionKey = 'alpine';
      // } else {
      //  versionKey = parts[0] === 3 && parts[1] >= 9 ? 'alpine' : 'alpineLibreSSL';
      // }
    }
    return versionKey
  }).then(linux => {
    const liboboeName = oboeNames[linux]

    // must find the library
    if (!fs.existsSync(dir + liboboeName)) {
      throw new Error(`cannot find ${dir}${liboboeName}`)
    }

    //
    // setup the symbolic links to the right version of liboboe
    //

    // remove links if they exist
    if (isSymbolicLink(dir + 'liboboe.so')) {
      fs.unlinkSync(dir + 'liboboe.so')
    }

    if (isSymbolicLink(dir + soname)) {
      fs.unlinkSync(dir + soname)
    }

    fs.symlinkSync(liboboeName, dir + 'liboboe.so')
    fs.symlinkSync(liboboeName, dir + soname)

    // delete the unused file if indicated. ignore errors.
    if (deleteUnused) {
      const unusedOboe = oboeNames[linux === 'alpine' ? 'linux' : 'alpine']
      // do async so errors can easily be ignored
      fs.unlink(dir + unusedOboe, function (err) {
        console.log(err) // eslint-disable-line no-console
        process.exit(0)
      })
    }
    process.exit(0)
  }).catch(e => {
    console.error(e) // eslint-disable-line no-console
    process.exit(1)
  })
}

function isSymbolicLink (name) {
  try {
    if (fs.lstatSync(name).isSymbolicLink()) {
      return true
    }
  } catch (e) {
    // ignore errors
  }
  return false
}

if (!module.parent) {
  const i = setInterval(function () {}, 100)
  setupLiboboe(function () { clearInterval(i) })
} else {
  module.exports = setupLiboboe
}
