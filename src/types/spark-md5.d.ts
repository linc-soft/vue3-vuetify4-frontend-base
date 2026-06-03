declare module 'spark-md5' {
  class SparkMD5 {
    constructor()
    append(str: string): this
    appendBinary(contents: string): this
    end(raw?: boolean): string
    reset(): this
    destroy(): void
    static hash(str: string, raw?: boolean): string
    static hashBinary(content: string, raw?: boolean): string
  }

  namespace SparkMD5 {
    class ArrayBuffer {
      constructor()
      append(arr: ArrayBuffer): this
      end(raw?: boolean): string
      reset(): this
      static hash(arr: ArrayBuffer, raw?: boolean): string
    }
  }

  export default SparkMD5
}
