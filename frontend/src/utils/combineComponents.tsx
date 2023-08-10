import { PropsWithChildren, ReactNode } from "react"
import { JSX } from "react/jsx-runtime"

const combineComponents = (...components: (({ children }: { children?: ReactNode }) => JSX.Element)[]) => {
  return components.reduce(
    (AccumulatedComponent, CurrentComponent) => {
      return function _({ children }: PropsWithChildren) {
        return (
          <AccumulatedComponent>
            <CurrentComponent>{children}</CurrentComponent>
          </AccumulatedComponent>
        )
      }
    },
    ({ children }) => <>{children}</>,
  )
}

export default combineComponents
