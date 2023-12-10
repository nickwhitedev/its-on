import MDFilledButton from '../material/button/MDFilledButton'
import MDOutlinedTextField from '../material/text-field/MDOutlinedTextField'

interface Props {
  username: string
  onSubmitForgotPassword: () => void
  onUpdateUsername: (value: string) => void
}

const ForgotPassword = ({
  username,
  onSubmitForgotPassword,
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
      <MDFilledButton onClick={onSubmitForgotPassword}>
        Reset password
      </MDFilledButton>
    </div>
  )
}

export default ForgotPassword
