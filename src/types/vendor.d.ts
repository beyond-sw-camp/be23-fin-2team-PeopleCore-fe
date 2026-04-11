import 'mammoth'

declare module 'mammoth' {
  interface ConvertOptions {
    arrayBuffer?: ArrayBuffer
    styleMap?: string[]
  }
}

declare module 'tinymce' {
  interface RawEditorOptions {
    license_key?: string
  }
}
