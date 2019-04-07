export function romFileToData(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.result) resolve(reader.result as string)
    }

    reader.readAsBinaryString(file)
  })
}

export function loadURLAsText(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    var req = new XMLHttpRequest()
    req.open('GET', path)
    req.overrideMimeType('text/plain; charset=x-user-defined')
    req.onerror = () => {
      reject()
      console.log(`Error loading ${path}: ${req.statusText}`)
    }

    req.onload = function() {
      if (this.status === 200) {
        resolve(this.responseText)
      } else if (this.status === 0) {
        // Aborted, so ignore error
      }
    }

    req.send()
  })
}

export function getSampleRate() {
  if (!AudioContext) {
    return 44100
  }
  let myCtx = new AudioContext()
  let sampleRate = myCtx.sampleRate
  myCtx.close()
  return sampleRate
}
