from allauth.account.forms import SignupForm, LoginForm

class CustomSignupForm(SignupForm):
    # Add your custom fields here, if needed
    pass

class CustomLoginForm(LoginForm):
    pass
