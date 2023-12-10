import MDFilledButton from '../material/button/MDFilledButton'
import MDOutlinedTextField from '../material/text-field/MDOutlinedTextField'

interface Props {
  password: string
  username: string
  onSignIn: () => void
  onUpdatePassword: (value: string) => void
  onUpdateUsername: (value: string) => void
}

const SignIn = ({
  password,
  username,
  onSignIn,
  onUpdatePassword,
  onUpdateUsername,
}: Props) => {
  return (
    <div>
      <MDOutlinedTextField
        label='Username'
        value={username}
        onInput={(event: Event) => {
          onUpdateUsername((event.target as unknown as { value: string }).value)
        }}
      />
      <MDOutlinedTextField
        label='Password'
        value={password}
        onInput={(event: Event) => {
          onUpdatePassword((event.target as unknown as { value: string }).value)
        }}
      />
      <MDFilledButton onClick={onSignIn}>Sign In</MDFilledButton>
    </div>
  )
}

export default SignIn
