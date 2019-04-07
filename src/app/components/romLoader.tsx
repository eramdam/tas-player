import React, { FC } from 'react'

interface RomLoaderProps {
  onFile: (file: File) => void
}

export const RomLoader: FC<RomLoaderProps> = ({ onFile }) => (
  <input
    type="file"
    onChange={ev => {
      const { target } = ev
      const files = target.files ? Array.from(target.files) : []
      const [file] = files

      if (!file) return

      onFile(file)
    }}
  />
)
