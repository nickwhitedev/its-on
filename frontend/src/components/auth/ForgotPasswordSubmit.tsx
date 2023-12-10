import MDFilledButton from '../material/button/MDFilledButton'
import MDOutlinedTextField from '../material/text-field/MDOutlinedTextField'

interface Props {
  confirmationCode: string
  password: string
  onUpdateConfirmationCode: (value: string) => void
  onUpdatePassword: (value: string) => void
  onSubmitNewPassword: () => void
}

const ForgotPasswordSubmit = ({
  confirmationCode,
  password,
  onUpdateConfirmationCode,
  onUpdatePassword,
  onSubmitNewPassword,
}: Props) => {
  return (
    <div>
      <MDOutlinedTextField
        label='Confirmation code'
        value={confirmationCode}
        onInput={(event: Event) => {
          onUpdateConfirmationCode(
            (event.target as unknown as { value: string }).value,
          )
        }}
      />
      <MDOutlinedTextField
        placeholder='New password'
        type='password'
        value={password}
        onInput={(event: Event) => {
          onUpdatePassword((event.target as unknown as { value: string }).value)
        }}
      />
      <MDFilledButton onClick={onSubmitNewPassword}>
        Save new password
      </MDFilledButton>
    </div>
  )
}

export default ForgotPasswordSubmit
