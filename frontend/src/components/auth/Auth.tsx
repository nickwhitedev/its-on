// Form.js
import { Auth } from 'aws-amplify'
import { useState } from 'react'
import ConfirmSignUp from './ConfirmSignUp'
import ForgotPassword from './ForgotPassword'
import ForgotPasswordSubmit from './ForgotPasswordSubmit'
import SignIn from './SignIn'
import SignUp from './SignUp'

const initialFormState = {
  username: '',
  password: '',
  email: '',
  confirmationCode: '',
}

async function signUp({ username, password, email }, updateFormType) {
  try {
    await Auth.signUp({
      username,
      password,
      attributes: { email },
    })
    console.log('sign up success!')
    updateFormType('confirmSignUp')
  } catch (err) {
    console.log('error signing up..', err)
  }
}

async function confirmSignUp({ username, confirmationCode }, updateFormType) {
  try {
    await Auth.confirmSignUp(username, confirmationCode)
    updateFormType('signIn')
  } catch (err) {
    console.log('error signing up..', err)
  }
}

async function signIn({ username, password }, setUser) {
  try {
    const user = await Auth.signIn(username, password)
    const userInfo = { username: user.username, ...user.attributes }
    setUser(userInfo)
  } catch (err) {
    console.log('error signing up..', err)
  }
}

async function forgotPassword({ username }, updateFormType) {
  try {
    await Auth.forgotPassword(username)
    updateFormType('forgotPasswordSubmit')
  } catch (err) {
    console.log('error submitting username to reset password...', err)
  }
}

async function forgotPasswordSubmit(
  { username, confirmationCode, password },
  updateFormType,
) {
  try {
    await Auth.forgotPasswordSubmit(username, confirmationCode, password)
    updateFormType('signIn')
  } catch (err) {
    console.log('error updating password... :', err)
  }
}

function Form(props) {
  const [formType, updateFormType] = useState('signIn')
  const [formState, updateFormState] = useState(initialFormState)
  function updateForm(event) {
    const newFormState = {
      ...formState,
      [event.target.name]: event.target.value,
    }
    updateFormState(newFormState)
  }

  function renderForm() {
    switch (formType) {
      case 'signUp':
        return (
          <SignUp
            signUp={() => signUp(formState, updateFormType)}
            updateFormState={e => updateForm(e)}
          />
        )
      case 'confirmSignUp':
        return (
          <ConfirmSignUp
            confirmSignUp={() => confirmSignUp(formState, updateFormType)}
            updateFormState={e => updateForm(e)}
          />
        )
      case 'signIn':
        return (
          <SignIn
            signIn={() => signIn(formState, props.setUser)}
            updateFormState={e => updateForm(e)}
          />
        )
      case 'forgotPassword':
        return (
          <ForgotPassword
            forgotPassword={() => forgotPassword(formState, updateFormType)}
            updateFormState={e => updateForm(e)}
          />
        )
      case 'forgotPasswordSubmit':
        return (
          <ForgotPasswordSubmit
            forgotPasswordSubmit={() =>
              forgotPasswordSubmit(formState, updateFormType)
            }
            updateFormState={e => updateForm(e)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div>
      {renderForm()}
      {formType === 'signUp' && (
        <p>
          Already have an account?{' '}
          <span onClick={() => updateFormType('signIn')}>Sign In</span>
        </p>
      )}
      {formType === 'signIn' && (
        <>
          <p>
            Need an account?{' '}
            <span onClick={() => updateFormType('signUp')}>Sign Up</span>
          </p>
          <p>
            Forget your password?{' '}
            <span onClick={() => updateFormType('forgotPassword')}>
              Reset Password
            </span>
          </p>
        </>
      )}
    </div>
  )
}
