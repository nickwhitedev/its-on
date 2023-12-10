import MDFilledButton from '../material/button/MDFilledButton'
import MDOutlinedTextField from '../material/text-field/MDOutlinedTextField'

interface Props {
  confirmationCode: string
  onConfirmSignUp: () => void
  onUpdateConfirmationCode: (value: string) => void
}

const ConfirmSignUp = ({
  confirmationCode,
  onConfirmSignUp,
  onUpdateConfirmationCode,
}: Props) => {
  return (
    <div>
      <MDOutlinedTextField
        label='Confirmation Code'
        value={confirmationCode}
        onInput={(event: Event) => {
          onUpdateConfirmationCode(
            (event.target as unknown as { value: string }).value,
          )
        }}
      />
      <MDFilledButton onClick={onConfirmSignUp}>Confirm Sign Up</MDFilledButton>
    </div>
  )
}

export default ConfirmSignUp
