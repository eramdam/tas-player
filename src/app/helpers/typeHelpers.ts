import * as t from 'io-ts';

export function makeEnumRuntimeType<T>(srcEnum: object) {
  const enumValues = new Set(Object.values(srcEnum))
  return new t.Type<T, string>(
    'Enum',
    (value: any): value is T => Boolean(value && enumValues.has(value)),
    (value, context) => {
      if (!value || !enumValues.has(value)) return t.failure(value, context)

      return t.success((value as any) as T)
    },
    value => value.toString()
  )
}
