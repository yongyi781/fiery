export function randomChoice<T>(arr: ArrayLike<T>) {
  return arr[Math.floor(Math.random() * arr.length)]
}
