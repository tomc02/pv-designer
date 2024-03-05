from django import template

register = template.Library()


@register.filter(name='get_month_name')
def get_month_name(value, arg):
    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return month_names[value - 1]
