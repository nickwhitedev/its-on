import { ReactNode } from "react"
import { JSX } from "react/jsx-runtime"

const combineComponents = (...components: (({ children }: { children?: ReactNode }) => JSX.Element)[]) => {
  return components.reduce(
    (AccumulatedComponent, CurrentComponent) => {
      return ({ children }) => {
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
