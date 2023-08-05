from allauth.account.forms import SignupForm, LoginForm

class CustomSignupForm(SignupForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'

    pass

class CustomLoginForm(LoginForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['login'].widget.attrs['class'] = 'form-control mb-3'
        self.fields['password'].widget.attrs['class'] = 'form-control mb-3'
        self.fields['remember'].widget.attrs['class'] = 'form-check-input'

        # Add custom placeholder text for form fields
        self.fields['login'].widget.attrs['placeholder'] = 'Username or Email'
        self.fields['password'].widget.attrs['placeholder'] = 'Password'

