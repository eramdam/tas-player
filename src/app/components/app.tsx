import React, {Component} from 'react';

import {FM2Movie, parseTasFile} from '../helpers/fm2Helpers';
import {loadURLAsText} from '../helpers/romHelpers';
import {Emulator} from './emulator';

interface AppState {
  romData?: string
  tasData?: FM2Movie
}
export class App extends Component<{}, AppState> {
  constructor(props: any) {
    super(props)

    this.state = {}
  }

  async componentDidMount() {
    const romData = await loadURLAsText(
      'http://127.0.0.1:8080/roms/ducktales.nes'
    )
    const tasData = await loadURLAsText(
      'http://127.0.0.1:8080/tas/ducktales.fm2'
    ).then(parseTasFile)
    this.setState({
      romData,
      tasData,
    })
  }

  // private onFilePicked = async (file: File) => {
  //   const binary = await romFileToData(file)
  //   console.log(binary)

  //   this.setState({
  //     romData: binary,
  //   })
  // }

  render() {
    return (
      <div>
        {/* <RomLoader onFile={this.onFilePicked} /> */}
        <Emulator {...this.state} />
      </div>
    )
  }
}
