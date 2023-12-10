import MDFilledButton from '../material/button/MDFilledButton'
import MDOutlinedTextField from '../material/text-field/MDOutlinedTextField'

interface Props {
  emailAddress: string
  password: string
  username: string
  onSignUp: () => void
  onUpdateEmailAddress: (value: string) => void
  onUpdatePassword: (value: string) => void
  onUpdateUsername: (value: string) => void
}

const SignUp = ({
  emailAddress,
  password,
  username,
  onSignUp,
  onUpdateEmailAddress,
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
        type='password'
        value={password}
        onInput={(event: Event) => {
          onUpdatePassword((event.target as unknown as { value: string }).value)
        }}
      />
      <MDOutlinedTextField
        label='Email'
        type='email'
        value={emailAddress}
        onInput={(event: Event) => {
          onUpdateEmailAddress(
            (event.target as unknown as { value: string }).value,
          )
        }}
      />
      <MDFilledButton onClick={onSignUp}>Sign Up</MDFilledButton>
    </div>
  )
}

export default SignUp
